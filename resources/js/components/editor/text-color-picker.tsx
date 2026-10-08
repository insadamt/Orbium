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
    const selectedRange = useRef<{ from: number; to: number } | null>(null);
    return (
        <TextColorMenu
            active={active}
            currentColor={
                editor.getAttributes('textColor').color as string | undefined
            }
            onOpen={() => {
                selectedRange.current = {
                    from: editor.state.selection.from,
                    to: editor.state.selection.to,
                };
            }}
            onChoose={(color, keepOpen) => {
                const range = selectedRange.current;
                if (!range || range.to > editor.state.doc.content.size) return;
                const command = editor.chain();
                if (!keepOpen) command.focus();
                command.setTextSelection(range);
                if (color) command.setMark('textColor', { color }).run();
                else command.unsetMark('textColor').run();
            }}
        />
    );
}
