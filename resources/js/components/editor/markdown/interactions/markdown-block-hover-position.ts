import type { EditorView } from '@codemirror/view';

type MarkdownBlockPointer = { clientX: number; clientY: number };

export function markdownBlockPointerTarget(
    view: EditorView,
    pointer: MarkdownBlockPointer,
) {
    const bounds = view.dom.getBoundingClientRect();
    const surface = view.dom.closest('.floating-document-island');
    const left = surface?.getBoundingClientRect().left ?? bounds.left - 52;
    if (
        pointer.clientY < bounds.top ||
        pointer.clientY > bounds.bottom ||
        pointer.clientX < left ||
        pointer.clientX > bounds.right
    )
        return null;

    const content = view.contentDOM.getBoundingClientRect();
    const x = Math.max(
        content.left + 1,
        Math.min(content.right - 1, pointer.clientX),
    );
    const target = view.dom.ownerDocument.elementFromPoint(x, pointer.clientY);
    return target && view.contentDOM.contains(target) ? target : null;
}

export function markdownBlockHoverPosition(
    view: EditorView,
    pointer: MarkdownBlockPointer,
): number | null {
    const target = markdownBlockPointerTarget(view, pointer);
    if (!target) return null;
    const layout = target.closest('.orbium-markdown-block-layout');
    // Wrapper starts remain unambiguous even in widget padding and lower halves.
    if (layout) return view.posAtDOM(layout, 0);
    const widget = target.closest<HTMLElement>('[data-rich-from]');
    return widget
        ? Number(widget.dataset.richFrom)
        : view.posAtCoords({ x: pointer.clientX, y: pointer.clientY });
}
