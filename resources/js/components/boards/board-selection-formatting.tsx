import { createPortal } from 'react-dom';
import { useState } from 'react';
import type { Editor } from '@tiptap/core';
import { BoardNativeFormatting } from './board-native-formatting';
import { ToolbarHighlight } from '@/components/editor/ui/toolbar-motion';
import { mountBoardToolbarMotion } from './board-toolbar-motion';
import { useBoardFormattingPriority } from './use-board-formatting-priority';
import { useBoardEditorAnchor } from './use-board-editor-anchor';

export function BoardSelectionFormatting({
    editor,
    disabled,
    boardId,
    onFinish,
}: {
    editor: Editor;
    disabled: boolean;
    boardId: number;
    onFinish: () => void;
}) {
    const [linkOpen, setLinkOpen] = useState(false);
    const surface = useBoardEditorAnchor(
        editor,
        linkOpen ? 'caret' : 'selection',
        boardId,
    );
    useBoardFormattingPriority(editor, surface, boardId);
    return createPortal(
        <div
            ref={surface}
            hidden
            data-board-editor
            role="toolbar"
            aria-label="Text formatting"
            aria-orientation="horizontal"
            className="board-selection-formatting orbium-editor-toolbar editor-animated-toolbar glass-surface"
            data-toolbar-positioned="false"
        >
            <ToolbarHighlight mountReveal={mountBoardToolbarMotion} />
            <BoardNativeFormatting
                editor={editor}
                disabled={disabled}
                onLinkOpenChange={setLinkOpen}
                onFinish={onFinish}
            />
        </div>,
        document.body,
    );
}
