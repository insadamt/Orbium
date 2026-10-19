import { useEffect, useLayoutEffect } from 'react';
import { closeCompletion } from '@codemirror/autocomplete';
import { EditorState, type Compartment } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

export function useMarkdownEditorActivity({
    view,
    editing,
    active,
    visible,
    readOnly = false,
}: {
    view: EditorView | null;
    editing: Compartment;
    active: boolean;
    visible: boolean;
    readOnly?: boolean;
}) {
    // A visible split companion must accept block transfers even while the other pane owns shortcuts.

    useLayoutEffect(() => {
        view?.dispatch({
            effects: editing.reconfigure([
                EditorView.editable.of(visible && !readOnly),
                EditorState.readOnly.of(readOnly),
                // Commands can dispatch edits directly; only finish an existing upload after a conflict.

                EditorState.transactionFilter.of((transaction) =>
                    !readOnly ||
                    !transaction.docChanged ||
                    transaction.isUserEvent('input.attachment')
                        ? transaction
                        : [],
                ),
            ]),
        });
    }, [view, editing, visible, readOnly]);

    useEffect(() => {
        if (!view || active) return;
        closeCompletion(view);
        view.contentDOM.blur();
    }, [view, active]);
}
