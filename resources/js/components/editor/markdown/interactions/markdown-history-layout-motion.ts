import type { Transaction } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { animateAlignmentChange } from '../../alignment-motion';
import { readOrbiumMetadata } from '../dialect/metadata';
import { markdownAlignmentElements } from './markdown-alignment-elements';
import {
    markdownBlockAt,
    markdownBlockPresentation,
} from './markdown-block-actions';
import { animateMarkdownBlockHistory } from './markdown-block-history-motion';

function layoutSignature(source: string) {
    const header = /^:{3,}orbium (.+)$/m.exec(source.split('\n', 1)[0]);
    const metadata = header ? readOrbiumMetadata(header[1]) : null;
    return JSON.stringify([
        metadata?.dir ?? 'auto',
        metadata?.align ?? metadata?.alignment ?? 'start',
    ]);
}

export function dispatchMarkdownHistoryWithLayoutMotion(
    transactions: readonly Transaction[],
    view: EditorView,
) {
    if (animateMarkdownBlockHistory(transactions, view)) return;
    const historyChanged = transactions.some(
        (transaction) =>
            transaction.docChanged &&
            (transaction.isUserEvent('undo') ||
                transaction.isUserEvent('redo')),
    );
    const nextState = transactions.at(-1)?.state;
    if (!historyChanged || !nextState) {
        view.update(transactions);
        return;
    }
    const changes = transactions.reduce(
        (combined, transaction) => combined.compose(transaction.changes),
        view.state.changes([]),
    );
    const positions = new Map<number, number>();
    changes.iterChangedRanges((fromBefore, _toBefore, fromAfter) => {
        const before = markdownBlockAt(view.state, fromBefore);
        const after = markdownBlockAt(nextState, fromAfter);
        if (layoutSignature(before.source) !== layoutSignature(after.source))
            positions.set(before.from, after.from);
    });
    if (!positions.size) {
        view.update(transactions);
        return;
    }
    let updated = false;
    animateAlignmentChange({
        container: view.contentDOM,
        readElements: () =>
            Array.from(positions, ([before, after]) => {
                const block = markdownBlockAt(
                    view.state,
                    updated ? after : before,
                );
                const presentation = markdownBlockPresentation(view, block);
                return markdownAlignmentElements(
                    view,
                    presentation.contentFrom,
                    block.from,
                );
            }).flat(),
        applyChange: () => {
            view.update(transactions);
            updated = true;
        },
        onComplete: () => view.requestMeasure(),
    });
}
