import type { EditorView } from '@codemirror/view';

export function markdownBlockHoverPosition(
    view: EditorView,
    event: PointerEvent,
): number | null {
    const bounds = view.dom.getBoundingClientRect();
    if (
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom ||
        event.clientX > bounds.right
    )
        return null;

    const content = view.contentDOM.getBoundingClientRect();
    const x = Math.max(
        content.left + 1,
        Math.min(content.right - 1, event.clientX),
    );
    const target = view.dom.contains(event.target as Node)
        ? event.target
        : view.dom.ownerDocument.elementFromPoint(x, event.clientY);
    const widget =
        target instanceof Element
            ? target.closest<HTMLElement>('[data-rich-from]')
            : null;
    return widget && view.dom.contains(widget)
        ? Number(widget.dataset.richFrom)
        : view.posAtCoords({ x, y: event.clientY });
}
