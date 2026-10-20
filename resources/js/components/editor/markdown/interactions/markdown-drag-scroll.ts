import type { EditorView } from '@codemirror/view';

type MarkdownDragPointer = { clientX: number; clientY: number };

function collectMarkdownDragScrollContext(view: EditorView) {
    const surface = view.dom.closest('.floating-document-island');
    const bounds = (surface ?? view.dom).getBoundingClientRect();
    let top = 0;
    let bottom = window.innerHeight;
    let left = Math.max(0, bounds.left - (surface ? 0 : 52));
    let right = Math.min(window.innerWidth, bounds.right);
    const scrollContainers: HTMLElement[] = [];
    let element: HTMLElement | null = view.scrollDOM;
    let offsetX = 0;
    let offsetY = 0;
    let scaleX = 1;
    let scaleY = 1;
    while (element) {
        const ownerWindow = element.ownerDocument.defaultView;
        if (!ownerWindow) break;
        const style = ownerWindow.getComputedStyle(element);
        const bounds = element.getBoundingClientRect();
        if (/(auto|scroll|hidden|clip)/.test(style.overflowY)) {
            top = Math.max(top, (bounds.top - offsetY) / scaleY);
            bottom = Math.min(bottom, (bounds.bottom - offsetY) / scaleY);
        }
        if (
            !view.dom.contains(element) &&
            /(auto|scroll|hidden|clip)/.test(style.overflowX)
        ) {
            left = Math.max(left, (bounds.left - offsetX) / scaleX);
            right = Math.min(right, (bounds.right - offsetX) / scaleX);
        }
        if (
            /(auto|scroll)/.test(style.overflowY) ||
            element === element.ownerDocument.scrollingElement
        )
            scrollContainers.push(element);
        if (element.parentElement) {
            element = element.parentElement;
            continue;
        }
        const frame = ownerWindow.frameElement as HTMLElement | null;
        if (!frame) break;
        // Embedded documents grow to their content; the visible scrollbar belongs to the host pane.
        const frameBounds = frame.getBoundingClientRect();
        const frameScaleX = frameBounds.width / (frame.offsetWidth || 1);
        const frameScaleY = frameBounds.height / (frame.offsetHeight || 1);
        if (frameScaleX <= 0 || frameScaleY <= 0) break;
        offsetX = (offsetX + frame.clientLeft) * frameScaleX + frameBounds.left;
        offsetY = (offsetY + frame.clientTop) * frameScaleY + frameBounds.top;
        scaleX *= frameScaleX;
        scaleY *= frameScaleY;
        const hostWindow = frame.ownerDocument.defaultView;
        if (!hostWindow) break;
        top = Math.max(top, -offsetY / scaleY);
        bottom = Math.min(bottom, (hostWindow.innerHeight - offsetY) / scaleY);
        left = Math.max(left, -offsetX / scaleX);
        right = Math.min(right, (hostWindow.innerWidth - offsetX) / scaleX);
        element = frame.parentElement;
    }
    return { viewport: { top, bottom, left, right }, scrollContainers };
}

export function markdownDragViewport(view: EditorView) {
    return collectMarkdownDragScrollContext(view).viewport;
}

export function scrollMarkdownDrag(
    view: EditorView,
    pointer: MarkdownDragPointer,
    elapsed: number,
) {
    const viewport = markdownDragViewport(view);
    const edge = Math.min(96, (viewport.bottom - viewport.top) / 4);
    if (
        edge <= 0 ||
        pointer.clientX < viewport.left ||
        pointer.clientX > viewport.right
    )
        return false;
    const pointerY = Math.max(
        viewport.top,
        Math.min(viewport.bottom, pointer.clientY),
    );
    const direction =
        pointerY < viewport.top + edge
            ? -1
            : pointerY > viewport.bottom - edge
              ? 1
              : 0;
    if (!direction) return false;
    const distance =
        direction < 0 ? pointerY - viewport.top : viewport.bottom - pointerY;
    const proximity = 1 - distance / edge;
    const pixelsPerSecond = 80 + 1320 * proximity * proximity;
    const delta =
        (direction * pixelsPerSecond * Math.max(0, Math.min(elapsed, 32))) /
        1000;
    scrollMarkdownDragBy(view, delta);
    // A rounded delta or a temporarily unchanged layout must not end an edge hold.
    return true;
}

export function scrollMarkdownDragBy(view: EditorView, delta: number) {
    let remaining = delta;
    for (const element of collectMarkdownDragScrollContext(view)
        .scrollContainers) {
        const previous = element.scrollTop;
        element.scrollTo({ top: previous + remaining, behavior: 'instant' });
        remaining -= element.scrollTop - previous;
        if (Math.abs(remaining) < 0.01) break;
        //
        // A hosted Document owns only its card viewport, even when a drag reaches the scroll boundary.
        //
        if (
            element.matches(
                '[data-split-pane-id], [data-board-resource-scroll]',
            )
        )
            break;
    }
    return remaining !== delta;
}
