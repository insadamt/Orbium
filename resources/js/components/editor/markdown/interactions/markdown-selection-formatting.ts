import type { EditorState } from '@codemirror/state';
import type { SyntaxNode } from '@lezer/common';
import { markdownNodeAt } from '../markdown-syntax';
import { readOrbiumMetadata } from '../dialect/metadata';

export function markdownSelectionFormatting(state: EditorState) {
    const range = state.selection.main;
    const result = {
        bold: false,
        italic: false,
        underline: false,
        strike: false,
        code: false,
        link: false,
        color: undefined as string | undefined,
        href: undefined as string | undefined,
    };
    for (
        let node: SyntaxNode | null = markdownNodeAt(
            state,
            Math.min(range.from + 1, range.to),
        );
        node;
        node = node.parent
    ) {
        if (node.to < range.to) continue;
        if (node.name === 'StrongEmphasis') result.bold = true;
        if (node.name === 'Emphasis') result.italic = true;
        if (node.name === 'Strikethrough') result.strike = true;
        if (node.name === 'InlineCode') result.code = true;
        if (node.name === 'Link') {
            result.link = true;
            const url = node.getChild('URL');
            if (url)
                result.href = state
                    .sliceDoc(url.from, url.to)
                    .replace(/^<|>$/g, '');
        }
        if (node.name === 'OrbiumSpan') {
            const json = node.getChild('OrbiumMetadata');
            const metadata =
                json &&
                readOrbiumMetadata(
                    state.sliceDoc(json.from, json.to),
                    'inline',
                );
            if (metadata?.color && !result.color)
                result.color = String(metadata.color);
            if (metadata?.underline) result.underline = true;
        }
    }
    return result;
}
