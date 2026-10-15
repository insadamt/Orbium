type PointerPosition = { x: number; y: number };

function findScrollContainer(container: Element): HTMLElement {
    let ancestor = container.parentElement;
    while (ancestor) {
        if (
            /(auto|scroll)/.test(getComputedStyle(ancestor).overflowY) &&
            ancestor.scrollHeight > ancestor.clientHeight
        )
            return ancestor;
        ancestor = ancestor.parentElement;
    }
    return document.scrollingElement as HTMLElement;
}

export function startExplorerDragScroll(
    container: Element,
    readPointer: () => PointerPosition,
    onScroll: () => void,
) {
    const scrollContainer = findScrollContainer(container);
    let frame = 0;
    let previousTime = performance.now();
    function scrollAtEdge(time: number) {
        const elapsed = Math.min(time - previousTime, 32);
        previousTime = time;
        const pointer = readPointer();
        const viewport = scrollContainer === document.scrollingElement;
        const bounds = scrollContainer.getBoundingClientRect();
        const top = viewport ? 0 : Math.max(0, bounds.top);
        const bottom = viewport
            ? window.innerHeight
            : Math.min(window.innerHeight, bounds.bottom);
        const left = viewport ? 0 : bounds.left;
        const right = viewport ? window.innerWidth : bounds.right;
        const edgeSize = Math.min(80, (bottom - top) / 3);
        if (
            pointer.x >= left &&
            pointer.x <= right &&
            pointer.y >= top &&
            pointer.y <= bottom
        ) {
            const direction =
                pointer.y < top + edgeSize
                    ? -Math.min(1, (top + edgeSize - pointer.y) / edgeSize)
                    : pointer.y > bottom - edgeSize
                      ? Math.min(1, (pointer.y - bottom + edgeSize) / edgeSize)
                      : 0;
            const previousScroll = scrollContainer.scrollTop;
            scrollContainer.scrollTop += direction * elapsed * 0.65;
            if (scrollContainer.scrollTop !== previousScroll) onScroll();
        }
        frame = requestAnimationFrame(scrollAtEdge);
    }
    frame = requestAnimationFrame(scrollAtEdge);
    return () => cancelAnimationFrame(frame);
}
