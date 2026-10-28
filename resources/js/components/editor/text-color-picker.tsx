import { applySelectionTextColor } from './apply-selection-text-color';
import type { SelectionBookmark } from '@tiptap/pm/state';
import type { Editor } from '@tiptap/core';
import { useRef } from 'react';
import { TextColorMenu } from './ui/text-color-menu';

export function TextColorPicker({
    editor,
    active,
}: {
    editor: Editor;
    active: boolean;
}) {
    const selectedRange = useRef<SelectionBookmark | null>(null);
    return (
        <TextColorMenu
            active={active}
            currentColor={
                editor.getAttributes('textColor').color as string | undefined
            }
            onOpen={() => {
                selectedRange.current = editor.state.selection.getBookmark();
            }}
            onChoose={(color, keepOpen) => {
                if (!selectedRange.current || editor.isDestroyed) return;
                applySelectionTextColor(
                    editor,
                    selectedRange.current.resolve(editor.state.doc),
                    color,
                    !keepOpen,
                );
            }}
        />
    );
}
