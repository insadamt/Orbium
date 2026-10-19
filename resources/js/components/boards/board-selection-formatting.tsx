import { createPortal } from 'react-dom';
import { useState } from 'react';
import type { Editor } from '@tiptap/core';
import { BoardNativeFormatting } from './board-native-formatting';
import { useBoardEditorAnchor } from './use-board-editor-anchor';

export function BoardSelectionFormatting({
    editor,
    disabled,
}: {
    editor: Editor;
    disabled: boolean;
}) {
    const [linkOpen, setLinkOpen] = useState(false);
    const surface = useBoardEditorAnchor(
        editor,
        linkOpen ? 'caret' : 'selection',
    );
    return createPortal(
        <div
            ref={surface}
            hidden
            data-board-editor
            className="board-selection-formatting orbium-editor-toolbar glass-surface"
        >
            <BoardNativeFormatting
                editor={editor}
                disabled={disabled}
                onLinkOpenChange={setLinkOpen}
            />
        </div>,
        document.body,
    );
}
