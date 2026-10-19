import { invertedEffects } from '@codemirror/commands';
import { EditorState, StateEffect, type Transaction } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import {
    preserveRichWidgetsDuringMove,
    richBlockMove,
} from '../rich/rich-widget-move';
import {
    markdownBlockMotion,
    type MarkdownBlockMotionSnapshot,
} from './markdown-block-motion';

type BlockRange = { from: number; to: number };
type BlockMotion = { before?: BlockRange; after?: BlockRange };

// Exact ranges keep repeated or identical block text from selecting the wrong history animation.

export const markdownBlockMotionEffect = StateEffect.define<BlockMotion>();

export const markdownBlockHistoryMotion = [
    invertedEffects.of((transaction) =>
        transaction.effects.flatMap((effect) =>
            effect.is(markdownBlockMotionEffect)
                ? [
                      markdownBlockMotionEffect.of({
                          before: effect.value.after,
                          after: effect.value.before,
                      }),
                  ]
                : [],
        ),
    ),
    EditorState.transactionExtender.of((transaction) => {
        if (
            !transaction.isUserEvent('undo') &&
            !transaction.isUserEvent('redo')
        )
            return null;
        const motion = transaction.effects.find((effect) =>
            effect.is(markdownBlockMotionEffect),
        )?.value;
        if (!motion) return null;
        const destination =
            motion.after?.from ??
            transaction.changes.mapPos(motion.before?.from ?? 0, -1);
        return {
            effects: EditorView.scrollIntoView(
                Math.min(destination, transaction.newDoc.length),
                { y: 'center' },
            ),
            annotations:
                motion.before && motion.after
                    ? richBlockMove.of({
                          ...motion.before,
                          destination: motion.after.from,
                      })
                    : [],
        };
    }),
];

type PreparedMotion = {
    snapshot: MarkdownBlockMotionSnapshot | null;
    consumed: boolean;
};
const preparedMotion = new WeakMap<EditorView, PreparedMotion>();

export function withPreparedMarkdownHistoryMotion<T>(
    view: EditorView,
    block: BlockRange,
    applyHistory: () => T,
): T {
    const prepared = {
        snapshot: view.plugin(markdownBlockMotion)?.capture(block) ?? null,
        consumed: false,
    };
    preparedMotion.set(view, prepared);
    try {
        return applyHistory();
    } finally {
        preparedMotion.delete(view);
        if (!prepared.consumed) prepared.snapshot?.ghost?.element.remove();
    }
}

export function animateMarkdownBlockHistory(
    transactions: readonly Transaction[],
    view: EditorView,
): boolean {
    const effect = transactions
        .flatMap((transaction) =>
            transaction.isUserEvent('undo') || transaction.isUserEvent('redo')
                ? transaction.effects.filter((effect) =>
                      effect.is(markdownBlockMotionEffect),
                  )
                : [],
        )
        .at(-1);
    if (!effect) return false;
    const { before, after } = effect.value;
    const motion = view.plugin(markdownBlockMotion);
    const prepared = preparedMotion.get(view);
    const snapshot = prepared ? prepared.snapshot : motion?.capture(before);
    if (prepared) prepared.consumed = true;
    const changes = transactions.reduce(
        (combined, transaction) => combined.compose(transaction.changes),
        view.state.changes([]),
    );
    const applyHistory = () => {
        view.update(transactions);
        if (snapshot) motion?.playAfterLayout(snapshot, changes, after);
    };
    if (before && after) {
        preserveRichWidgetsDuringMove(
            view,
            { ...before, destination: after.from },
            changes,
            applyHistory,
        );
    } else applyHistory();
    return true;
}
