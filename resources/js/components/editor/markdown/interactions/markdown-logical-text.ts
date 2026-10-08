import type { Text } from '@codemirror/state';
import type { SyntaxNode } from '@lezer/common';
import { markdownSourceParser } from './markdown-source-parser';
import { readOrbiumMetadata } from '../dialect/metadata';

export type LogicalMarkdown = {
    text: string;
    starts: number[];
    ends: number[];
};
export type LogicalMarkdownMatch = { from: number; to: number };
const cache = new WeakMap<Text, LogicalMarkdown>();
const hidden = new Set([
    'HeaderMark',
    'QuoteMark',
    'ListMark',
    'EmphasisMark',
    'StrikethroughMark',
    'CodeMark',
    'CodeInfo',
    'TaskMarker',
    'LinkMark',
    'URL',
    'LinkTitle',
    'LinkLabel',
    'LinkReference',
    'TableDelimiter',
    'OrbiumSpanMark',
    'OrbiumMetadata',
    'OrbiumHeader',
    'OrbiumClose',
    'HorizontalRule',
]);
const inlineContainers = new Set([
    'Paragraph',
    'Task',
    'StrongEmphasis',
    'Emphasis',
    'Strikethrough',
    'Link',
    'Image',
    'InlineCode',
    'OrbiumSpan',
    'TableCell',
    'Autolink',
]);

export function logicalMarkdownText(documentSource: Text): LogicalMarkdown {
    const existing = cache.get(documentSource);
    if (existing) return existing;
    const source = documentSource.toString();
    const output: LogicalMarkdown = { text: '', starts: [], ends: [] };
    const chunks: string[] = [];
    const append = (text: string, from: number, to?: number) => {
        if (!text) return;
        chunks.push(text);
        for (let index = 0; index < text.length; index++) {
            output.starts.push(to === undefined ? from + index : from);
            output.ends.push(to ?? from + index + 1);
        }
    };
    const appendGap = (from: number, to: number) =>
        append(source.slice(from, to).replace(/\n/g, ' '), from);
    const jsonValue = (
        node: SyntaxNode,
        key: 'caption' | 'latex',
        prefixLength: number,
    ) => {
        const header = source.slice(node.from + prefixLength, node.to);
        const match = new RegExp(
            `"${key}"\\s*:\\s*("(?:[^"\\\\]|\\\\.)*")`,
        ).exec(header);
        if (!match) return;
        const position =
            node.from + prefixLength + match.index + match[0].indexOf(match[1]);
        const raw = match[1];
        for (let index = 1; index < raw.length - 1;) {
            const length =
                raw[index] === '\\' ? (raw[index + 1] === 'u' ? 6 : 2) : 1;
            const spelling = raw.slice(index, index + length);
            try {
                append(
                    JSON.parse(`"${spelling}"`) as string,
                    position + index,
                    position + index + length,
                );
            } catch {
                append(spelling, position + index);
            }
            index += length;
        }
    };
    const visit = (node: SyntaxNode, depth = 0) => {
        if (depth > 64 || hidden.has(node.name)) return;
        if (node.name === 'Escape') {
            append(source.slice(node.from + 1, node.to), node.from, node.to);
            return;
        }
        if (node.name === 'Entity') {
            const decoder = document.createElement('textarea');
            decoder.innerHTML = source.slice(node.from, node.to);
            append(decoder.value, node.from, node.to);
            return;
        }
        if (
            ['HTMLBlock', 'HTMLTag', 'CodeText', 'OrbiumLiteral'].includes(
                node.name,
            )
        ) {
            append(source.slice(node.from, node.to), node.from);
            return;
        }
        if (node.name === 'OrbiumMath') {
            append(source.slice(node.from + 1, node.to - 1), node.from + 1);
            return;
        }
        if (node.name === 'OrbiumInlineMath') {
            jsonValue(node, 'latex', 12);
            return;
        }
        if (node.name === 'OrbiumDirective') {
            const header = node.getChild('OrbiumHeader');
            const headerText = header && source.slice(header.from, header.to);
            const metadata =
                headerText &&
                readOrbiumMetadata(
                    headerText.slice(headerText.indexOf('{')).trimEnd(),
                );
            if (metadata && header) {
                if (metadata.kind === 'math') {
                    jsonValue(header, 'latex', headerText!.indexOf('{'));
                    return;
                }
                const body = node.getChild('Document');
                if (body) visit(body, depth + 1);
                if (metadata.kind === 'image' && metadata.caption) {
                    append('\n', header.from, header.from);
                    jsonValue(header, 'caption', headerText!.indexOf('{'));
                }
                return;
            }
        }
        if (/Heading[1-6]$/.test(node.name)) inlineContainers.add(node.name);
        const inline = inlineContainers.has(node.name);
        let position = node.from;
        let hasChild = false;
        for (let child = node.firstChild; child; child = child.nextSibling) {
            if (inline && position < child.from)
                appendGap(position, child.from);
            visit(child, depth + 1);
            hasChild = true;
            position = child.to;
            if (!inline && !hidden.has(child.name))
                append(
                    node.name === 'TableRow' || node.name === 'TableHeader'
                        ? '\t'
                        : '\n',
                    child.to,
                    child.to,
                );
        }
        if (inline && position < node.to) appendGap(position, node.to);
        else if (!hasChild && !node.type.is('Block'))
            appendGap(node.from, node.to);
    };
    visit(markdownSourceParser.parse(source).topNode);
    output.text = chunks.join('');
    cache.set(documentSource, output);
    return output;
}

export function findLogicalMarkdownMatches(
    source: Text,
    query: string,
): LogicalMarkdownMatch[] {
    if (!query) return [];
    const logical = logicalMarkdownText(source);
    const matches: LogicalMarkdownMatch[] = [];
    // RegExp's Unicode case folding retains source offsets, unlike lowercasing the document.
    const expression = new RegExp(
        query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'giu',
    );
    for (const match of logical.text.matchAll(expression)) {
        const start = match.index;
        const end = start + match[0].length - 1;
        let from = logical.starts[start],
            to = logical.ends[end];
        for (let index = start; index <= end; index++) {
            from = Math.min(from, logical.starts[index]);
            to = Math.max(to, logical.ends[index]);
        }
        if (to > from) matches.push({ from, to });
    }
    return matches;
}
