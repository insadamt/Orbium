import { markdownLanguage } from '@codemirror/lang-markdown';
import type { MarkdownParser } from '@lezer/markdown';
import type { SyntaxNode } from '@lezer/common';
import { EditorState } from '@codemirror/state';
import { orbiumMarkdownDialect } from '@/components/editor/markdown/dialect/markdown-dialect';
import { readRichBlock } from '@/components/editor/markdown/rich/read-rich-block';
import {
    safeBoardLink,
    plainInline,
    createBoardBlockData,
} from './board-block-data';
import type {
    BoardBlockData,
    BoardBlockKind,
    BoardInline,
    BoardObject,
} from './board-types';

const parser = (markdownLanguage.parser as MarkdownParser).configure(
    orbiumMarkdownDialect,
);
type LegacyObject = Omit<
    BoardObject,
    'data' | 'block_type' | 'content_format_version'
> & {
    block_type: 'paragraph' | 'markdown';
    content_format_version: 2;
    markdown: string;
};
type NativeContent = { kind: BoardBlockKind; data: BoardBlockData };
const hidden = new Set([
    'HeaderMark',
    'QuoteMark',
    'ListMark',
    'EmphasisMark',
    'StrikethroughMark',
    'CodeMark',
    'LinkMark',
    'URL',
    'TaskMarker',
    'OrbiumHeader',
    'OrbiumClose',
    'OrbiumMetadata',
    'OrbiumSpanMark',
]);

function inlineContent(source: string, root: SyntaxNode): BoardInline[] {
    const output: BoardInline[] = [];
    function visit(
        node: SyntaxNode,
        marks: NonNullable<BoardInline['marks']> = [],
    ) {
        if (hidden.has(node.name)) return;
        if (node.name === 'HardBreak') {
            output.push({ type: 'hardBreak' });
            return;
        }
        const mark = (
            {
                StrongEmphasis: 'bold',
                Emphasis: 'italic',
                Strikethrough: 'strike',
                InlineCode: 'code',
            } as const
        )[node.name as 'StrongEmphasis'];
        if (mark) marks = [...marks, { type: mark }];
        if (node.name === 'Link') {
            const url = node.getChild('URL');
            const href = url
                ? source.slice(url.from, url.to).replace(/^<|>$/g, '')
                : '';
            if (href && safeBoardLink(href))
                marks = [...marks, { type: 'link', attrs: { href } }];
        }
        if (!node.firstChild) {
            const text = source.slice(node.from, node.to);
            if (text)
                output.push({
                    type: 'text',
                    text,
                    ...(marks.length ? { marks } : {}),
                });
            return;
        }
        let previous = node.from;
        for (
            let child: SyntaxNode | null = node.firstChild;
            child;
            child = child.nextSibling
        ) {
            const gap = source.slice(previous, child.from);
            if (gap)
                output.push(
                    ...plainInline(gap).map((part) => ({
                        ...part,
                        ...(marks.length ? { marks } : {}),
                    })),
                );
            visit(child, marks);
            previous = child.to;
        }
        const tail = source.slice(previous, node.to);
        if (tail)
            output.push(
                ...plainInline(tail).map((part) => ({
                    ...part,
                    ...(marks.length ? { marks } : {}),
                })),
            );
    }
    visit(root);
    return output;
}
function richInline(source: string) {
    const tree = parser.parse(source);
    const content: BoardInline[] = [];
    for (let node = tree.topNode.firstChild; node; node = node.nextSibling) {
        if (content.length) content.push({ type: 'hardBreak' });
        content.push(...inlineContent(source, node));
    }
    return content;
}
function readNativeContent(source: string): NativeContent[] {
    const state = EditorState.create({ doc: source });
    const tree = parser.parse(source);
    const result: NativeContent[] = [];
    function append(node: SyntaxNode, presentation: BoardBlockData = {}) {
        const rich = readRichBlock(state, node);
        const style = {
            ...presentation,
            ...(rich?.presentation.align
                ? { align: rich.presentation.align }
                : {}),
            ...(rich?.presentation.dir ? { dir: rich.presentation.dir } : {}),
        } as BoardBlockData;
        if (
            rich &&
            ['code', 'math', 'mermaid', 'inline-math'].includes(rich.kind)
        ) {
            const kind =
                rich.kind === 'inline-math'
                    ? 'math'
                    : (rich.kind as BoardBlockKind);
            result.push({
                kind,
                data: {
                    ...style,
                    source: rich.content,
                    ...(kind === 'code'
                        ? { language: rich.language || 'plaintext' }
                        : {}),
                },
            });
            return;
        }
        if (rich?.kind === 'image' || rich?.kind === 'file') {
            result.push({
                kind: rich.kind,
                data: {
                    ...style,
                    attachment_id: rich.attachmentId
                        ? Number(rich.attachmentId)
                        : null,
                    name: rich.label || '',
                    caption: String(rich.metadata.caption ?? ''),
                },
            });
            return;
        }
        if (rich?.kind === 'table' && rich.table) {
            // Preserve a legacy table's text in its cells; the original source retains richer metadata.

            result.push({
                kind: 'table',
                data: {
                    ...style,
                    rows: rich.table.rows.map((row) =>
                        row.map((cell) => richInline(cell.source)),
                    ),
                },
            });
            return;
        }
        if (rich?.kind === 'callout') {
            result.push({
                kind: 'callout',
                data: { ...style, content: richInline(rich.content) },
            });
            return;
        }
        if (node.name === 'OrbiumDirective') {
            const body = node.getChild('Document');
            if (body?.firstChild) {
                for (
                    let child: SyntaxNode | null = body.firstChild;
                    child;
                    child = child.nextSibling
                )
                    append(child, style);
                return;
            }
            if (rich?.kind === 'empty') {
                result.push({
                    kind: 'text',
                    data: createBoardBlockData('text'),
                });
                return;
            }
        }
        if (node.name === 'HorizontalRule') {
            result.push({ kind: 'divider', data: {} });
            return;
        }
        if (node.name === 'BulletList' || node.name === 'OrderedList') {
            const items: NonNullable<BoardBlockData['items']> = [];
            let checkedList = false;
            function readList(list: SyntaxNode, indent: number) {
                for (
                    let item = list.firstChild;
                    item;
                    item = item.nextSibling
                ) {
                    if (item.name !== 'ListItem') continue;
                    const content: BoardInline[] = [];
                    const nested: SyntaxNode[] = [];
                    let checked = false;
                    for (
                        let child = item.firstChild;
                        child;
                        child = child.nextSibling
                    ) {
                        if (
                            ['BulletList', 'OrderedList'].includes(child.name)
                        ) {
                            nested.push(child);
                            continue;
                        }
                        if (hidden.has(child.name)) continue;
                        const itemSource = source.slice(child.from, child.to);
                        if (/^\[[ xX]\]/.test(itemSource)) {
                            checkedList = true;
                            checked = /^\[[xX]\]/.test(itemSource);
                        }
                        if (content.length) content.push({ type: 'hardBreak' });
                        content.push(...inlineContent(source, child));
                    }
                    items.push({
                        content,
                        checked,
                        indent: Math.min(indent, 12),
                    });
                    for (const child of nested) readList(child, indent + 1);
                }
            }
            readList(node, 0);
            result.push({
                kind: 'list',
                data: {
                    ...style,
                    list_style: checkedList
                        ? 'check'
                        : node.name === 'OrderedList'
                          ? 'ordered'
                          : 'bullet',
                    items: items.length
                        ? items
                        : [{ content: [], checked: false, indent: 0 }],
                },
            });
            return;
        }
        const heading = /^(?:ATX|Setext)Heading([1-6])$/.exec(node.name);
        const kind = heading
            ? 'heading'
            : node.name === 'Blockquote'
              ? 'quote'
              : 'text';
        result.push({
            kind,
            data: {
                ...style,
                content: inlineContent(source, node),
                ...(heading ? { level: Math.min(Number(heading[1]), 3) } : {}),
            },
        });
    }
    for (let node = tree.topNode.firstChild; node; node = node.nextSibling)
        append(node);
    return result.length
        ? result
        : [{ kind: 'text', data: createBoardBlockData('text') }];
}
export function convertLegacyBoardObject(value: unknown): BoardObject[] {
    const object = value as LegacyObject;
    if (
        !object ||
        object.content_format_version !== 2 ||
        !['paragraph', 'markdown'].includes(object.block_type) ||
        typeof object.markdown !== 'string' ||
        object.markdown.includes('\0') ||
        new TextEncoder().encode(object.markdown).length > 131072
    )
        throw new Error(
            'Unsupported legacy Board block; download the original snapshot for recovery.',
        );
    if (
        ![object.x, object.y, object.width, object.height, object.layer].every(
            Number.isFinite,
        ) ||
        object.width < 160 ||
        object.width > 4000 ||
        object.height < 100 ||
        object.height > 4000 ||
        Math.abs(object.x) > 10_000_000 ||
        Math.abs(object.y) > 10_000_000 ||
        !Number.isInteger(object.layer) ||
        object.layer < 0 ||
        object.layer > 1_000_000
    )
        throw new Error(
            'Invalid legacy Board geometry. Download the original snapshot for recovery.',
        );
    const blocks = readNativeContent(object.markdown);
    const referenced = new Set(
        blocks.flatMap((block) =>
            block.data.attachment_id ? [block.data.attachment_id] : [],
        ),
    );
    parser.parse(object.markdown).iterate({
        enter: (node) => {
            if (
                [
                    'FencedCode',
                    'CodeBlock',
                    'InlineCode',
                    'OrbiumMath',
                    'OrbiumInlineMath',
                    'OrbiumMathBlock',
                ].includes(node.name)
            )
                return false;
            if (node.name !== 'URL') return;
            const match = /^<?orbium:attachment\/([1-9]\d*)>?$/.exec(
                object.markdown.slice(node.from, node.to),
            );
            if (!match || referenced.has(Number(match[1]))) return;
            referenced.add(Number(match[1]));
            const kind = node.node.parent?.name === 'Image' ? 'image' : 'file';
            blocks.push({
                kind,
                data: {
                    attachment_id: Number(match[1]),
                    name: 'Recovered attachment',
                    caption: '',
                },
            });
        },
    });
    const height = Math.max(48, Math.min(object.height / blocks.length, 320));
    return blocks.map((block, index) => ({
        id: index ? crypto.randomUUID() : object.id,
        block_type: block.kind,
        content_format_version: 1,
        data: {
            ...block.data,
            ...(index === 0 ? { legacy_source: object.markdown } : {}),
        },
        x: object.x,
        y: Math.min(10_000_000, object.y + index * (height + 24)),
        width: object.width,
        height: blocks.length === 1 ? object.height : height,
        layer: object.layer + index,
    }));
}
