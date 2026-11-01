// Summary: Rejects body/type mismatches before a live native edit can become an unsavable document; depends on the shared typed body parser and safe presentation metadata.
import type { SyntaxNode } from '@lezer/common';
import type { Text, Transaction } from '@codemirror/state';
import type { V3DocumentIndex } from '../structure/v3-document-index';
import { parseV3Body } from '../runtime/v3-markdown-dialect';
import { readOrbiumMetadata } from '../dialect/metadata';
import type { V3BlockType } from '../structure/v3-contract';
import type { V3ParsedStructure } from '../structure/v3-structure-types';
import { v3TextPrefixLength } from './v3-text-prefix';
import { readCalloutSource } from '../dialect/callout-source';

function bodyNodes(node: SyntaxNode) {
    const children: SyntaxNode[] = [];
    for (let child = node.firstChild; child; child = child.nextSibling)
        if (child.name !== 'LinkReference') children.push(child);
    return children;
}

export function isV3BodyTypeValid(source: string, type: V3BlockType): boolean {
    if (type === 'spacer') return /^[ \t\n]*$/.test(source);
    if (type === 'columns') return true;
    let nodes = bodyNodes(parseV3Body(source, type).topNode);
    for (
        let depth = 0;
        depth < 32 && nodes[0]?.name === 'OrbiumDirective';
        depth++
    ) {
        const wrapper = nodes[0];
        const header = wrapper.getChild('OrbiumHeader');
        const metadata =
            header &&
            readOrbiumMetadata(
                source
                    .slice(header.from, header.to)
                    .replace(/^:{3,}orbium /, '')
                    .trimEnd(),
            );
        if (metadata?.kind === 'block') {
            if (nodes.length !== 1) return false;
            const body = wrapper.getChild('Document');
            nodes = body ? bodyNodes(body) : [];
        } else
            return (
                nodes.length === 1 &&
                (metadata?.kind === type ||
                    (type === 'paragraph' && metadata?.kind === 'empty') ||
                    (type === 'mermaid' && metadata?.kind === 'code'))
            );
    }
    if (!nodes.length)
        return (
            type === 'paragraph' ||
            (/^heading-[1-6]$/.test(type) &&
                source.trim() === '#'.repeat(Number(type.slice(-1)))) ||
            (/^(bullet-list|checklist)$/.test(type) &&
                /^\s*[-+*]\s*(?:\[[ xX]\])?\s*$/.test(source)) ||
            (type === 'numbered-list' && /^\s*\d+[.)]\s*$/.test(source)) ||
            (/^(quote|callout)$/.test(type) && source.trim() === '>')
        );
    if (
        !/^(paragraph|heading-[1-6]|bullet-list|checklist|numbered-list|quote)$/.test(
            type,
        ) &&
        nodes.length !== 1
    )
        return false;
    return nodes.every((node) => {
        if (type === 'paragraph') return node.name === 'Paragraph';
        if (/^heading-[1-6]$/.test(type))
            return new RegExp(`^(?:ATX|Setext)Heading${type.slice(-1)}$`).test(
                node.name,
            );
        if (type === 'bullet-list' || type === 'checklist')
            return (
                node.name === 'BulletList' &&
                (type !== 'checklist' ||
                    Boolean(node.firstChild?.getChild('Task')))
            );
        if (type === 'numbered-list') return node.name === 'OrderedList';
        if (type === 'quote') return node.name === 'Blockquote';
        if (type === 'callout')
            return (
                node.name === 'Blockquote' &&
                Boolean(readCalloutSource(source.slice(node.from, node.to)))
            );
        if (type === 'divider') return node.name === 'HorizontalRule';
        if (type === 'code' || type === 'mermaid')
            return (
                (node.name === 'FencedCode' &&
                    node.getChildren('CodeMark').length >= 2) ||
                node.name === 'CodeBlock'
            );
        if (type === 'math') return node.name === 'OrbiumMathBlock';
        if (type === 'table') return node.name === 'Table';
        if (type === 'image')
            return node.name === 'Paragraph' && Boolean(node.getChild('Image'));
        return (
            ['file', 'audio', 'video', 'pdf'].includes(type) &&
            node.name === 'Paragraph' &&
            Boolean(node.getChild('Link'))
        );
    });
}

export function changedV3BodyTypesAreValid(
    transaction: Transaction,
    before: V3DocumentIndex,
    after: V3ParsedStructure,
) {
    const ids = new Set<string>();
    transaction.changes.iterChangedRanges((from) => {
        const block = before.blockAt(from);
        if (!block || block.type === 'paragraph') return;
        const wrapper = before.structure.directives.find(
            (directive) =>
                directive.blockId === block.id &&
                directive.metadata.kind === 'block',
        );
        const start = wrapper?.bodyFrom ?? block.bodyFrom;
        const line = transaction.startState.doc.lineAt(start);
        const prefixLength = v3TextPrefixLength(block.type, line.text);
        if (
            from > line.to ||
            (prefixLength > 0 &&
                /[ \t]$/.test(line.text.slice(0, prefixLength)) &&
                from >= start + prefixLength)
        )
            return;
        ids.add(block.id);
    });
    return after.blocks.every(
        (block) =>
            !ids.has(block.id) ||
            isV3BodyTypeValid(
                transaction.newDoc.sliceString(block.bodyFrom, block.bodyTo),
                block.type,
            ),
    );
}

export function invalidV3BodyType(source: Text, index: V3DocumentIndex) {
    return index.structure.blocks.find(
        (block) =>
            !isV3BodyTypeValid(
                source.sliceString(block.bodyFrom, block.bodyTo),
                block.type,
            ),
    );
}
