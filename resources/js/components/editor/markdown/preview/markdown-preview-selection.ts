import { normalizeMentionSelection } from './markdown-mention-selection';
import { syntaxTree } from '@codemirror/language';
import { EditorSelection, EditorState } from '@codemirror/state';
import type { SyntaxNode } from '@lezer/common';
import { readOrbiumMetadata } from '../dialect/metadata';
import {
    isStructuralMarkdownSeparator,
    markdownBlockAt,
} from '../interactions/markdown-block-actions';

function isMarkdownSpacingPosition(state: EditorState, position: number) {
    if (isStructuralMarkdownSeparator(state, position)) return true;
    const line = state.doc.lineAt(position);
    if (
        line.text.trim() ||
        line.number !== state.doc.lines ||
        line.number === 1 ||
        markdownBlockAt(state, position).source.trim()
    )
        return false;
    const previousLine = state.doc.line(line.number - 1);
    // A single trailing newline is spacing unless it explicitly ends a paragraph with a hard break.
    return (
        Boolean(previousLine.text.trim()) &&
        !/(?: {2,}|(?<!\\)\\(?:\\\\)*)$/.test(previousLine.text)
    );
}

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
        if (
            transaction.isUserEvent('select.pointer') &&
            selection.ranges.length === 1 &&
            selection.main.empty &&
            isMarkdownSpacingPosition(
                transaction.startState,
                selection.main.head,
            )
        )
            return [
                transaction,
                {
                    selection: transaction.startState.selection,
                    sequential: true,
                },
            ];
        const ranges = selection.ranges.map((range, index) =>
            normalizeMentionSelection(
                transaction.startState,
                EditorSelection.range(
                    visibleSpanPosition(transaction.startState, range.anchor),
                    visibleSpanPosition(transaction.startState, range.head),
                ),
                transaction.startState.selection.ranges[index]?.head ??
                    transaction.startState.selection.main.head,
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
