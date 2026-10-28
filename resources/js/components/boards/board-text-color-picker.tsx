import { applySelectionTextColor } from '@/components/editor/apply-selection-text-color';
import type { Editor } from '@tiptap/core';
import type { SelectionBookmark } from '@tiptap/pm/state';
import { useRef } from 'react';
import { TextColorMenu } from '@/components/editor/ui/text-color-menu';

export function BoardTextColorPicker({
    editor,
    disabled,
}: {
    editor: Editor;
    disabled: boolean;
}) {
    const selectionBookmark = useRef<SelectionBookmark | null>(null);
    return (
        <div inert={disabled}>
            <TextColorMenu
                active={!disabled}
                currentColor={
                    editor.getAttributes('textColor').color ?? undefined
                }
                onOpen={() => {
                    //
                    // The spectrum takes focus, so keep the editor selection while choosing presets or adjusting a custom color.
                    //
                    selectionBookmark.current =
                        editor.state.selection.getBookmark();
                }}
                onChoose={(color, keepOpen) => {
                    if (
                        disabled ||
                        editor.isDestroyed ||
                        !selectionBookmark.current
                    )
                        return;
                    const selection = selectionBookmark.current.resolve(
                        editor.state.doc,
                    );
                    applySelectionTextColor(
                        editor,
                        selection,
                        color,
                        !keepOpen,
                    );
                }}
            />
        </div>
    );
}
