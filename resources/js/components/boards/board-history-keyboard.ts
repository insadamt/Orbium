import type { KeyboardEvent } from 'react';
import type { BoardObjectsController } from './use-board-objects';

export function handleBoardHistoryKeyboard(
    event: KeyboardEvent<HTMLElement>,
    model: BoardObjectsController,
    locked: boolean,
) {
    if (
        !(event.ctrlKey || event.metaKey) ||
        !['z', 'y'].includes(event.key.toLowerCase()) ||
        event.nativeEvent.isComposing
    )
        return false;
    const target = event.target as Element;
    //
    // Referenced Documents and property/link inputs own their independent histories; native Board blocks share the visible Board history controls.
    //
    if (
        target.closest(
            '.board-document-editor, [data-board-properties], [role="dialog"], [role="menu"], [role="listbox"]',
        ) ||
        (target.closest('input, textarea, select') &&
            !target.closest('.board-source-block'))
    )
        return false;
    event.preventDefault();
    event.stopPropagation();
    if (!locked) {
        if (event.shiftKey || event.key.toLowerCase() === 'y') model.redo();
        else model.undo();
    }
    return true;
}
