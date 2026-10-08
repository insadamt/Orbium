import { syntaxTree } from '@codemirror/language';
import type { EditorState } from '@codemirror/state';
import type { SyntaxNode } from '@lezer/common';
import { readEditableMarkdownPresentation } from './interactions/markdown-editable-presentation';

const literalNodes = new Set([
    'OrbiumDirective',
    'OrbiumMathBlock',
    'OrbiumUnclosed',
    'OrbiumMath',
    'OrbiumInlineMath',
    'FencedCode',
    'CodeBlock',
    'InlineCode',
    'HTMLBlock',
    'HTMLTag',
    'Table',
    'LinkReference',
    'Image',
    'Link',
    'Autolink',
    'URL',
]);

export function hasMarkdownAncestor(
    node: SyntaxNode | null,
    names: ReadonlySet<string>,
): boolean {
    for (let current = node; current; current = current.parent) {
        if (names.has(current.name)) return true;
    }
    return false;
}

export function markdownNodeAt(
    state: EditorState,
    position: number,
): SyntaxNode {
    return syntaxTree(state).resolveInner(position, -1);
}

export function isMarkdownLiteralPosition(
    state: EditorState,
    position: number,
): boolean {
    for (
        let node: SyntaxNode | null = markdownNodeAt(state, position);
        node;
        node = node.parent
    ) {
        if (readEditableMarkdownPresentation(state, node)) continue;
        if (literalNodes.has(node.name)) return true;
    }
    return false;
}

export function isMarkdownSourceOnlyLine(text: string): boolean {
    return /^\s*:orbium\s*\{/.test(text);
}

export function escapeMarkdownLabel(text: string): string {
    return text.replace(/[\r\n]/g, ' ').replace(/[\\[\]*_`]/g, '\\$&');
}
