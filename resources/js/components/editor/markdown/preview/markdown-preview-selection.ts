import { syntaxTree } from '@codemirror/language';
import { EditorSelection, EditorState } from '@codemirror/state';
import type { SyntaxNode } from '@lezer/common';
import { readOrbiumMetadata } from '../dialect/metadata';

function visibleSpanPosition(state: EditorState, position: number): number {
    for (
        let node: SyntaxNode | null = syntaxTree(state).resolveInner(
            position,
            1,
        );
        node;
        node = node.parent
    ) {
        if (node.name !== 'OrbiumSpan') continue;
        const metadata = node.getChild('OrbiumMetadata');
        const markers = node.getChildren('OrbiumSpanMark');
        const opening = markers[0];
        const closing = markers.at(-1);
        if (
            !metadata ||
            !opening ||
            !closing ||
            !readOrbiumMetadata(
                state.sliceDoc(metadata.from, metadata.to),
                'inline',
            )
        )
            continue;
        if (position > opening.from && position < opening.to) return opening.to;
        if (position > closing.from && position < metadata.to)
            return closing.from;
    }
    return position;
}

// Atomic decorations govern navigation commands, but direct selections can enter hidden syntax.
export const markdownPreviewSelection = EditorState.transactionFilter.of(
    (transaction) => {
        if (transaction.docChanged) return transaction;
        const selection = transaction.newSelection;
        const ranges = selection.ranges.map((range) =>
            EditorSelection.range(
                visibleSpanPosition(transaction.startState, range.anchor),
                visibleSpanPosition(transaction.startState, range.head),
            ),
        );
        const visibleSelection = EditorSelection.create(
            ranges,
            selection.mainIndex,
        );
        if (visibleSelection.eq(selection)) return transaction;
        return [transaction, { selection: visibleSelection, sequential: true }];
    },
);
