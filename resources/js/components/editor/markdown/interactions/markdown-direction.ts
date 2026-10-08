import type { EditorState, Text } from '@codemirror/state';
import { syntaxTree } from '@codemirror/language';
import type { SyntaxNode } from '@lezer/common';

const rtlLetter =
    /[\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Syriac}\p{Script=Thaana}\p{Script=Nko}\p{Script=Samaritan}\p{Script=Mandaic}\p{Script=Adlam}\p{Script=Hanifi_Rohingya}]/u;
const letter = /\p{Letter}/u;
const cached = new WeakMap<Text, Map<number, 'ltr' | 'rtl'>>();
const hidden = new Set([
    'HeaderMark',
    'QuoteMark',
    'ListMark',
    'EmphasisMark',
    'StrikethroughMark',
    'CodeMark',
    'CodeInfo',
    'URL',
    'LinkMark',
    'LinkTitle',
    'LinkLabel',
    'OrbiumMetadata',
    'OrbiumHeader',
    'OrbiumClose',
]);

export function firstMarkdownDirection(text: string): 'ltr' | 'rtl' | null {
    for (const character of text) {
        if (rtlLetter.test(character)) return 'rtl';
        if (letter.test(character)) return 'ltr';
    }
    return null;
}

function nodeDirection(
    state: EditorState,
    node: SyntaxNode,
): 'ltr' | 'rtl' | null {
    if (hidden.has(node.name)) return null;
    if (
        [
            'FencedCode',
            'CodeBlock',
            'OrbiumMath',
            'OrbiumInlineMath',
            'OrbiumMathBlock',
        ].includes(node.name)
    )
        return null;
    let position = node.from;
    for (let child = node.firstChild; child; child = child.nextSibling) {
        const gap = firstMarkdownDirection(
            state.sliceDoc(position, child.from),
        );
        if (gap) return gap;
        const direction = nodeDirection(state, child);
        if (direction) return direction;
        position = child.to;
    }
    return firstMarkdownDirection(state.sliceDoc(position, node.to));
}

export function markdownLineDirection(
    state: EditorState,
    position: number,
): 'ltr' | 'rtl' {
    const directions =
        cached.get(state.doc) ?? new Map<number, 'ltr' | 'rtl'>();
    cached.set(state.doc, directions);
    const line = state.doc.lineAt(position);
    const existing = directions.get(line.from);
    if (existing) return existing;
    let node = syntaxTree(state).resolveInner(position, 1);
    while (
        node.parent &&
        !/^(?:Paragraph|Task|(?:ATX|Setext)Heading[1-6])$/.test(node.name) &&
        node.parent.name !== 'Document'
    )
        node = node.parent;
    let direction =
        node.name === 'Document'
            ? firstMarkdownDirection(line.text)
            : nodeDirection(state, node);
    if (!direction) {
        // Neutral blocks inherit without caching a resolved direction in canonical source.
        for (let number = line.number - 1; number > 0; number--) {
            const previous = state.doc.line(number);
            const known = directions.get(previous.from);
            if (known) {
                direction = known;
                break;
            }
            const text = previous.text
                .replace(/^:{3,}orbium .*$/, '')
                .replace(/:orbium\[|\]\{.*?\}/g, '')
                .replace(/\]\([^)]*\)/g, ']');
            direction = firstMarkdownDirection(text);
            if (direction) break;
        }
    }
    directions.set(line.from, direction ?? 'ltr');
    return direction ?? 'ltr';
}
