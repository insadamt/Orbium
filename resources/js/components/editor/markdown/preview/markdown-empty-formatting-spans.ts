// Summary: Removes inline formatting wrappers when deletion empties their text; depends on the pre-edit Markdown tree and sequential changes to preserve selection and undo history.
import { syntaxTree } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import type { SyntaxNode } from '@lezer/common';

//
// Deleting the final visible text must also delete its hidden wrapper, or the now-empty span stops parsing and exposes formatting metadata as prose.
//
export const removeEmptyFormattingSpans = EditorState.transactionFilter.of(
    (transaction) => {
        if (!transaction.docChanged || !transaction.isUserEvent('delete'))
            return transaction;
        const tree = syntaxTree(transaction.startState);
        const spans = new Map<number, SyntaxNode>();
        transaction.changes.iterChangedRanges((from, to) => {
            if (from === to) return;
            //
            // Limit syntax traversal to the affected source so deletion does not scan a large document.
            //
            for (const position of [from, Math.max(from, to - 1)]) {
                for (
                    let node: SyntaxNode | null = tree.resolveInner(
                        position,
                        1,
                    );
                    node;
                    node = node.parent
                ) {
                    if (node.name === 'OrbiumSpan') spans.set(node.from, node);
                }
            }
        });
        if (!spans.size) return transaction;
        const removals: { from: number; to: number }[] = [];
        for (const node of spans.values()) {
            const marks = node.getChildren('OrbiumSpanMark');
            const opening = marks[0];
            const closing = marks[1];
            if (!opening || !closing) continue;
            const changes = transaction.changes;
            const from = changes.mapPos(node.from, -1);
            const contentFrom = changes.mapPos(opening.to, 1);
            const contentTo = changes.mapPos(closing.from, -1);
            const to = changes.mapPos(node.to, 1);
            //
            // Preserve intentional syntax edits and avoid deleting neighboring content when the original wrapper no longer survives intact.
            //
            if (
                from >= to ||
                contentFrom > contentTo ||
                transaction.newDoc.sliceString(from, contentFrom) !==
                    transaction.startState.sliceDoc(node.from, opening.to) ||
                transaction.newDoc.sliceString(contentTo, to) !==
                    transaction.startState.sliceDoc(closing.from, node.to) ||
                transaction.newDoc.sliceString(contentFrom, contentTo).trim()
            )
                continue;
            removals.push({ from, to });
        }
        if (!removals.length) return transaction;
        removals.sort(
            (left, right) => left.from - right.from || right.to - left.to,
        );
        const independent: typeof removals = [];
        for (const range of removals)
            if (
                !independent.length ||
                range.from >= independent[independent.length - 1].to
            )
                independent.push(range);
        //
        // Sequential changes join the user's deletion so selection mapping and undo restore the text and its formatting together.
        //
        return [transaction, { changes: independent, sequential: true }];
    },
);
