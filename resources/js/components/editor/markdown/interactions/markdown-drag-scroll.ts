import type { EditorView } from '@codemirror/view';

export function markdownDragViewport(view: EditorView) {
    let top = 0;
    let bottom = window.innerHeight;
    for (
        let element: HTMLElement | null = view.scrollDOM;
        element;
        element = element.parentElement
    ) {
        if (
            !/(auto|scroll|hidden|clip)/.test(
                getComputedStyle(element).overflowY,
            )
        )
            continue;
        const bounds = element.getBoundingClientRect();
        top = Math.max(top, bounds.top);
        bottom = Math.min(bottom, bounds.bottom);
    }
    return { top, bottom };
}

export function scrollMarkdownDrag(
    view: EditorView,
    pointerY: number,
    elapsed: number,
) {
    const viewport = markdownDragViewport(view);
    const edge = Math.min(56, (viewport.bottom - viewport.top) / 4);
    if (edge <= 0 || pointerY < viewport.top || pointerY > viewport.bottom)
        return false;
    const direction =
        pointerY < viewport.top + edge
            ? -1
            : pointerY > viewport.bottom - edge
              ? 1
              : 0;
    if (!direction) return false;
    const distance =
        direction < 0 ? pointerY - viewport.top : viewport.bottom - pointerY;
    const delta =
        direction * (1 - distance / edge) * Math.min(elapsed, 32) * 0.65;
    for (
        let element: HTMLElement | null = view.scrollDOM;
        element;
        element = element.parentElement
    ) {
        if (!/(auto|scroll)/.test(getComputedStyle(element).overflowY))
            continue;
        const previous = element.scrollTop;
        element.scrollTop += delta;
        if (element.scrollTop !== previous) return true;
    }
    const previous = window.scrollY;
    window.scrollBy({ top: delta, behavior: 'instant' });
    return window.scrollY !== previous;
}
