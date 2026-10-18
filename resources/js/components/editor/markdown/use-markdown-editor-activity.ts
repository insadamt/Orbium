import { useEffect, useLayoutEffect } from 'react';
import { closeCompletion } from '@codemirror/autocomplete';
import type { Compartment } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

export function useMarkdownEditorActivity({
    view,
    editing,
    active,
    visible,
}: {
    view: EditorView | null;
    editing: Compartment;
    active: boolean;
    visible: boolean;
}) {
    // A visible split companion must accept block transfers even while the other pane owns shortcuts.

    useLayoutEffect(() => {
        view?.dispatch({
            effects: editing.reconfigure(EditorView.editable.of(visible)),
        });
    }, [view, editing, visible]);

    useEffect(() => {
        if (!view || active) return;
        closeCompletion(view);
        view.contentDOM.blur();
    }, [view, active]);
}
