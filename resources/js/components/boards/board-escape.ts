import type { KeyboardEvent } from 'react';

export function handleBoardEscape(
    event: KeyboardEvent<HTMLElement>,
    options: {
        isLocked: () => boolean;
        cancelGesture: () => boolean;
        cancelTool: () => boolean;
        editing: boolean;
        finishEditing: () => void;
    },
) {
    if (
        event.key !== 'Escape' ||
        event.nativeEvent.isComposing ||
        event.defaultPrevented ||
        options.isLocked()
    )
        return;
    const target = event.target as Element;
    if (
        target.closest(
            '[role="dialog"], [role="menu"], [role="listbox"], [data-board-properties], [data-board-native-editor], select',
        ) ||
        document.fullscreenElement ||
        event.currentTarget.querySelector('.cm-tooltip-autocomplete')
    )
        return;

    //
    // Handle the innermost canvas action first so dismissing an editor or placement never also clears its selection.
    //
    if (options.cancelGesture() || options.cancelTool()) {
        event.preventDefault();
        event.stopPropagation();
        return;
    }
    if (options.editing) options.finishEditing();
    else return;
    event.preventDefault();
    event.stopPropagation();
}
