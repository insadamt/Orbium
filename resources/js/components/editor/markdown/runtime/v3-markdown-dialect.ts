// Summary: Parses each identified body independently for existing Markdown renderers; depends on the V3 scanner and existing dialect so blank lines, lists and reference definitions cannot merge sibling blocks.
import { v3StructureSnapshot } from '../structure/v3-structure-snapshots';
import type { Text } from '@codemirror/state';
import { markdownLanguage } from '@codemirror/lang-markdown';
import { Tree, type PartialParse } from '@lezer/common';
import type { MarkdownConfig, MarkdownParser } from '@lezer/markdown';
import { orbiumMarkdownDialect } from '../dialect/markdown-dialect';
import type { V3BlockType } from '../structure/v3-contract';
import { parseV3Structure } from '../structure/v3-structure-parser';
import { parseV3HeadingBody } from './v3-heading-body';

const bodyParser = (markdownLanguage.parser as MarkdownParser).configure(
    orbiumMarkdownDialect,
);
export const v3ParagraphParser = bodyParser.configure({
    remove: [
        'ATXHeading',
        'SetextHeading',
        'BulletList',
        'OrderedList',
        'Blockquote',
        'FencedCode',
        'IndentedCode',
        'HorizontalRule',
        'HTMLBlock',
        'Table',
        'OrbiumMathBlock',
    ],
});
const headingProseParser = v3ParagraphParser.configure({
    remove: ['OrbiumDirective'],
});

export function parseV3Body(source: string, type: V3BlockType) {
    const heading = /^heading-([1-6])$/.exec(type);
    return heading
        ? parseV3HeadingBody(
              source,
              Number(heading[1]),
              bodyParser,
              headingProseParser,
          )
        : (type === 'paragraph' ? v3ParagraphParser : bodyParser).parse(source);
}
const bodyTrees = new WeakMap<
    Tree,
    Map<string, { source: string; type: V3BlockType; tree: Tree }>
>();
const structuralParser = bodyParser.configure({
    defineNodes: [
        { name: 'V3Header', block: true },
        { name: 'V3Layout', block: true },
    ],
});
const headerType = structuralParser.nodeSet.types.find(
    (type) => type.name === 'V3Header',
)!;
const layoutType = structuralParser.nodeSet.types.find(
    (type) => type.name === 'V3Layout',
)!;

export const v3MarkdownDialect: MarkdownConfig = {
    defineNodes: [
        { name: 'V3Header', block: true },
        { name: 'V3Layout', block: true },
    ],
    wrap(_inner, input, fragments): PartialParse {
        let complete: Tree | null = null;
        const previousBodies = fragments
            .map((fragment) => bodyTrees.get(fragment.tree))
            .find(Boolean);
        const nextBodies = new Map<
            string,
            { source: string; type: V3BlockType; tree: Tree }
        >();
        const parseBody = (id: string, type: V3BlockType, source: string) => {
            const previous = previousBodies?.get(id);
            const tree =
                previous?.source === source && previous.type === type
                    ? previous.tree
                    : parseV3Body(source, type);
            nextBodies.set(id, { source, type, tree });
            return tree;
        };
        let parsedPosition = 0;
        let delegate = false;
        let stoppedAt: number | null = null;
        return {
            get parsedPos() {
                return delegate ? _inner.parsedPos : parsedPosition;
            },
            get stoppedAt() {
                return delegate ? _inner.stoppedAt : stoppedAt;
            },
            stopAt(position) {
                stoppedAt = position;
                _inner.stopAt(position);
            },
            advance() {
                if (complete) return complete;
                const source = input.read(0, input.length);
                if (!/^\s*\+\+block[ \t]/.test(source)) {
                    delegate = true;
                    return _inner.advance();
                }
                //
                // CodeMirror's document input exposes the immutable Text; reuse only an exactly matching derived snapshot, falling back for standalone string readers.
                //
                const document = (input as typeof input & { doc?: Text }).doc;
                const structure =
                    (document && v3StructureSnapshot(document)?.structure) ||
                    parseV3Structure(source);
                const columnsByLayout = new Map<string, Set<string>>();
                for (const column of structure.columns) {
                    const ids =
                        columnsByLayout.get(column.layoutId) ??
                        new Set<string>();
                    ids.add(column.id);
                    columnsByLayout.set(column.layoutId, ids);
                }
                const childrenByColumn = new Map<
                    string,
                    typeof structure.blocks
                >();
                for (const block of structure.blocks)
                    if (block.parentId !== null) {
                        const children =
                            childrenByColumn.get(block.parentId) ?? [];
                        children.push(block);
                        childrenByColumn.set(block.parentId, children);
                    }
                const children: Tree[] = [];
                const positions: number[] = [];
                if (!structure.diagnostics.length) {
                    for (const block of structure.blocks) {
                        if (block.parentId !== null) continue;
                        if (block.type === 'columns') {
                            const nested: Tree[] = [];
                            const offsets: number[] = [];
                            for (const child of [
                                ...(columnsByLayout.get(block.id) ?? []),
                            ].flatMap((id) => childrenByColumn.get(id) ?? [])) {
                                nested.push(
                                    new Tree(
                                        headerType,
                                        [],
                                        [],
                                        child.bodyFrom - child.from,
                                    ),
                                );
                                offsets.push(child.from - block.from);
                                const body = parseBody(
                                    child.id,
                                    child.type,
                                    source.slice(child.bodyFrom, child.bodyTo),
                                );
                                for (
                                    let node = body.topNode.firstChild;
                                    node;
                                    node = node.nextSibling
                                ) {
                                    nested.push(node.toTree());
                                    offsets.push(
                                        child.bodyFrom + node.from - block.from,
                                    );
                                }
                            }
                            children.push(
                                new Tree(
                                    layoutType,
                                    nested,
                                    offsets,
                                    block.to - block.from,
                                ),
                            );
                            positions.push(block.from);
                            continue;
                        }
                        children.push(
                            new Tree(
                                headerType,
                                [],
                                [],
                                block.bodyFrom - block.from,
                            ),
                        );
                        positions.push(block.from);
                        const body = parseBody(
                            block.id,
                            block.type,
                            source.slice(block.bodyFrom, block.bodyTo),
                        );
                        for (
                            let node = body.topNode.firstChild;
                            node;
                            node = node.nextSibling
                        ) {
                            children.push(node.toTree());
                            positions.push(block.bodyFrom + node.from);
                        }
                    }
                }
                complete = new Tree(
                    bodyParser.nodeSet.types.find(
                        (type) => type.name === 'Document',
                    )!,
                    children,
                    positions,
                    input.length,
                );
                bodyTrees.set(complete, nextBodies);
                parsedPosition = input.length;
                return complete;
            },
        };
    },
};
