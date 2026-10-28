import type { Editor } from '@tiptap/core';
import type { Selection } from '@tiptap/pm/state';
import { isValidTextColor } from './text-color';

export function applySelectionTextColor(
    editor: Editor,
    selection: Selection,
    color: string | null,
    focusEditor: boolean,
) {
    if (
        editor.isDestroyed ||
        !editor.isEditable ||
        editor.view.composing ||
        (color && !isValidTextColor(color))
    )
        return;
    const type = editor.schema.marks.textColor;
    if (!type || selection.to > editor.state.doc.content.size) return;
    const transaction = editor.state.tr
        .setSelection(selection)
        .setMeta('boardAction', true);
    //
    // One transaction keeps text and inline atoms on the same saved selection, including while the spectrum owns focus.
    //
    for (const range of selection.ranges) {
        transaction.removeMark(range.$from.pos, range.$to.pos, type);
        if (color)
            transaction.addMark(
                range.$from.pos,
                range.$to.pos,
                type.create({ color }),
            );
    }
    if (selection.empty) {
        transaction.removeStoredMark(type);
        if (color) transaction.addStoredMark(type.create({ color }));
    }
    editor.view.dispatch(transaction);
    if (focusEditor) editor.view.focus();
}
