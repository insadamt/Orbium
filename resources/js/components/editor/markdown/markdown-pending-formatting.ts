import { StateEffect, StateField } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

type PendingInlineFormatting = { anchor: number; delimiters: string[] };
export const setPendingInlineFormatting =
    StateEffect.define<PendingInlineFormatting | null>();

export const pendingInlineFormatting =
    StateField.define<PendingInlineFormatting | null>({
        create: () => null,
        update(previous, transaction) {
            let next = previous;
            if (
                transaction.docChanged ||
                (transaction.selection &&
                    transaction.selection.main.head !== previous?.anchor)
            )
                next = null;
            for (const effect of transaction.effects)
                if (effect.is(setPendingInlineFormatting)) next = effect.value;
            return next;
        },
    });

export const insertPendingInlineFormatting = EditorView.inputHandler.of(
    (view, from, to, text) => {
        const pending = view.state.field(pendingInlineFormatting);
        if (
            !pending ||
            from !== to ||
            from !== pending.anchor ||
            !text ||
            /[\r\n]/.test(text) ||
            view.compositionStarted ||
            !view.state.facet(EditorView.editable)
        )
            return false;
        const opening = pending.delimiters.join('');
        const closing = [...pending.delimiters].reverse().join('');
        view.dispatch({
            changes: { from, to, insert: `${opening}${text}${closing}` },
            selection: { anchor: from + opening.length + text.length },
            effects: setPendingInlineFormatting.of(null),
            userEvent: 'input.type',
        });
        return true;
    },
);
