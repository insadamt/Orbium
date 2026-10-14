import { ensureSyntaxTree, syntaxTree } from '@codemirror/language';
import type { EditorState, Transaction } from '@codemirror/state';
import type { Tree } from '@lezer/common';

export function markdownDecorationRange(
    state: EditorState,
    from: number,
    to: number,
    tree: Tree = ensureSyntaxTree(state, to, 50) ?? syntaxTree(state),
) {
    const first = tree.topNode.childAfter(Math.max(0, from - 1));
    const last = tree.topNode.childBefore(Math.min(state.doc.length, to + 1));
    return {
        from: Math.min(from, first?.from ?? from),
        to: Math.max(to, last?.to ?? to),
        tree,
    };
}

export function changedMarkdownDecorationRanges(transaction: Transaction) {
    const ranges: ReturnType<typeof markdownDecorationRange>[] = [];
    transaction.changes.iterChangedRanges((_from, _to, from, to) => {
        ranges.push(markdownDecorationRange(transaction.state, from, to));
    });
    return ranges;
}
