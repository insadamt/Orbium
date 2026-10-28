import { TextSelection } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';

type SelectionGesture = {
    anchor: number;
    startX: number;
    startY: number;
    includesIcon: boolean;
};

function rangeIncludesIcon(view: EditorView, anchor: number, head: number) {
    let includesIcon = false;
    view.state.doc.nodesBetween(
        Math.min(anchor, head),
        Math.max(anchor, head),
        (node) => {
            if (node.type.name === 'inlineIcon') includesIcon = true;
            return !includesIcon && !node.isInline;
        },
    );
    return includesIcon;
}

export function mountInlineIconPointerSelection(view: EditorView) {
    const ownerDocument = view.dom.ownerDocument;
    let gesture: SelectionGesture | null = null;

    function beginSelection(event: MouseEvent) {
        if (
            !view.editable ||
            view.composing ||
            event.defaultPrevented ||
            event.button !== 0 ||
            event.detail > 1 ||
            event.altKey ||
            event.ctrlKey ||
            event.metaKey ||
            (event.target instanceof Element &&
                event.target.closest(
                    'button, input, textarea, select, [role="button"]',
                ))
        )
            return;
        const position = view.posAtCoords({
            left: event.clientX,
            top: event.clientY,
        });
        if (!position) return;
        gesture = {
            anchor: event.shiftKey ? view.state.selection.anchor : position.pos,
            startX: event.clientX,
            startY: event.clientY,
            includesIcon: false,
        };
    }

    function extendSelection(event: MouseEvent) {
        if (!gesture || !view.editable || view.composing) return;
        if (
            !gesture.includesIcon &&
            Math.hypot(
                event.clientX - gesture.startX,
                event.clientY - gesture.startY,
            ) < 3
        )
            return;
        const position = view.posAtCoords({
            left: event.clientX,
            top: event.clientY,
        });
        if (!position) return;
        if (
            !gesture.includesIcon &&
            !rangeIncludesIcon(view, gesture.anchor, position.pos)
        )
            return;
        //
        // A noneditable glyph can split native DOM dragging; keep the complete range in the editor's text selection instead.
        //
        gesture.includesIcon = true;
        event.preventDefault();
        const selection = TextSelection.between(
            view.state.doc.resolve(gesture.anchor),
            view.state.doc.resolve(position.pos),
        );
        if (!selection.eq(view.state.selection))
            view.dispatch(view.state.tr.setSelection(selection));
    }

    function moveSelection(event: MouseEvent) {
        if (event.buttons & 1) extendSelection(event);
        else gesture = null;
    }

    function finishSelection(event: MouseEvent) {
        if (gesture?.includesIcon) extendSelection(event);
        gesture = null;
    }

    function cancelSelection() {
        gesture = null;
    }

    view.dom.addEventListener('mousedown', beginSelection);
    ownerDocument.addEventListener('mousemove', moveSelection, true);
    ownerDocument.addEventListener('mouseup', finishSelection, true);
    ownerDocument.addEventListener('pointercancel', cancelSelection, true);
    ownerDocument.defaultView?.addEventListener('blur', cancelSelection);
    return {
        update(_view: EditorView, previous: EditorView['state']) {
            if (!previous.doc.eq(view.state.doc)) cancelSelection();
        },
        destroy() {
            view.dom.removeEventListener('mousedown', beginSelection);
            ownerDocument.removeEventListener('mousemove', moveSelection, true);
            ownerDocument.removeEventListener('mouseup', finishSelection, true);
            ownerDocument.removeEventListener(
                'pointercancel',
                cancelSelection,
                true,
            );
            ownerDocument.defaultView?.removeEventListener(
                'blur',
                cancelSelection,
            );
        },
    };
}
