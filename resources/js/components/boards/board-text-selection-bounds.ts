import type { Editor } from '@tiptap/core';

export function readBoardTextSelectionBounds(editor: Editor) {
    const { from, to } = editor.state.selection;
    const start = editor.view.coordsAtPos(from);
    const end = editor.view.coordsAtPos(to);
    const browserSelection = editor.view.dom.ownerDocument.getSelection();
    //
    // The full range stays centered across wrapped lines; endpoint averaging can put the toolbar far from the actual selected text.
    //
    if (
        browserSelection?.rangeCount &&
        browserSelection.anchorNode &&
        browserSelection.focusNode &&
        editor.view.dom.contains(browserSelection.anchorNode) &&
        editor.view.dom.contains(browserSelection.focusNode)
    ) {
        const bounds = browserSelection.getRangeAt(0).getBoundingClientRect();
        if (bounds.width > 0 && bounds.height > 0) return bounds;
    }
    return {
        left: Math.min(start.left, end.left),
        right: Math.max(start.right, end.right),
        top: Math.min(start.top, end.top),
        bottom: Math.max(start.bottom, end.bottom),
    };
}
