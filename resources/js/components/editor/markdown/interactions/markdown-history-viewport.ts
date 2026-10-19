import { undo, redo } from '@codemirror/commands';
import type { Transaction } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { markdownBlockMotion } from './markdown-block-motion';

const pendingReveals = new WeakMap<EditorView, Set<() => void>>();

export function cancelMarkdownHistoryReveal(view: EditorView) {
    pendingReveals.get(view)?.forEach((finish) => finish());
    pendingReveals.delete(view);
}

export function historyRestorationAnchor(
    view: EditorView,
    direction: 'undo' | 'redo',
    restoredFrom: number,
) {
    let transaction: Transaction | null = null;
    const command = direction === 'undo' ? undo : redo;
    command({
        state: view.state,
        dispatch: (prepared) => {
            transaction = prepared;
        },
    });
    const prepared = transaction as Transaction | null;
    if (!prepared) return null;
    return prepared.changes.invert(view.state.doc).mapPos(restoredFrom, -1);
}

export function revealMarkdownHistoryLocation(
    view: EditorView,
    position: number,
): Promise<void> {
    view.plugin(markdownBlockMotion)?.finish();
    view.dispatch({
        effects: EditorView.scrollIntoView(
            Math.max(0, Math.min(position, view.state.doc.length)),
            { y: 'center' },
        ),
    });
    return new Promise((resolve) => {
        // The promise resumes after CodeMirror's measure loop applies scrolling and renders the destination.

        let pending = pendingReveals.get(view);
        if (!pending) pendingReveals.set(view, (pending = new Set()));
        const finish = () => {
            pending.delete(finish);
            resolve();
        };
        pending.add(finish);
        view.requestMeasure({ read: () => undefined, write: finish });
    });
}
