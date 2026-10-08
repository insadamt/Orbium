import { syntaxTree } from '@codemirror/language';
import type { EditorState } from '@codemirror/state';
import type { SyntaxNode } from '@lezer/common';

const pairedMarkers: Record<string, string> = {
    StrongEmphasis: 'EmphasisMark',
    Emphasis: 'EmphasisMark',
    Strikethrough: 'StrikethroughMark',
    InlineCode: 'CodeMark',
    Link: 'LinkMark',
};

function inlineBoundary(state: EditorState, node: SyntaxNode) {
    const markerName = pairedMarkers[node.name];
    if (!markerName) return null;
    const markers = node.getChildren(markerName);
    const first = markers[0];
    const last =
        node.name === 'Link'
            ? markers.find(
                  (marker) => state.sliceDoc(marker.from, marker.to) === ']',
              )
            : markers.at(-1);
    if (!first || !last || first === last) return null;
    return {
        from: first.from,
        to: node.to,
        contentFrom: first.to,
        contentTo: last.from,
        opening: state.sliceDoc(first.from, first.to),
        closing: state.sliceDoc(last.from, node.to),
    };
}

export function inlineFormattingBoundary(
    state: EditorState,
    edge: 'start' | 'end',
) {
    const selection = state.selection.main;
    if (!selection.empty) return null;
    for (
        let node: SyntaxNode | null = syntaxTree(state).resolveInner(
            selection.head,
            edge === 'start' ? 1 : -1,
        );
        node;
        node = node.parent
    ) {
        if (node.name === 'Link') continue;
        const boundary = inlineBoundary(state, node);
        if (
            boundary &&
            selection.head ===
                (edge === 'start' ? boundary.contentFrom : boundary.contentTo)
        )
            return boundary;
    }
    return null;
}

export function paragraphSplitDelimiters(state: EditorState) {
    const selection = state.selection.main;
    const boundaries: { opening: string; closing: string }[] = [];
    for (
        let node: SyntaxNode | null = syntaxTree(state).resolveInner(
            selection.from,
            -1,
        );
        node;
        node = node.parent
    ) {
        const boundary = inlineBoundary(state, node);
        if (
            boundary &&
            selection.from >= boundary.contentFrom &&
            selection.to <= boundary.contentTo
        )
            boundaries.push(boundary);
    }
    return {
        closing: boundaries.map((boundary) => boundary.closing).join(''),
        opening: boundaries
            .reverse()
            .map((boundary) => boundary.opening)
            .join(''),
    };
}
