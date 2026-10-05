export const mermaidPreparationViewports = 3;

export function findEditorScrollContainer(
    element: HTMLElement,
): HTMLElement | null {
    for (
        let parent = element.parentElement;
        parent;
        parent = parent.parentElement
    ) {
        if (/auto|scroll/.test(getComputedStyle(parent).overflowY))
            return parent;
    }
    return null;
}

export function rankMermaidElements(
    elements: Iterable<HTMLElement>,
    near: Set<HTMLElement>,
    observed: boolean,
    root: DOMRect | undefined,
    direction: number,
) {
    const top = Math.max(0, root?.top ?? 0);
    const bottom = Math.min(
        window.innerHeight,
        root?.bottom ?? window.innerHeight,
    );
    const height = Math.max(1, bottom - top);
    let rank = 3;
    let distance = Infinity;
    for (const element of elements) {
        if (!element.isConnected || (observed && !near.has(element))) continue;
        const bounds = element.getBoundingClientRect();
        if (
            bounds.left >= (root?.right ?? window.innerWidth) ||
            bounds.right <= (root?.left ?? 0)
        )
            continue;
        const offset =
            bounds.top >= bottom
                ? bounds.top - bottom
                : bounds.bottom <= top
                  ? bounds.bottom - top
                  : 0;
        const nextRank =
            bottom > top && offset === 0
                ? 0
                : Math.abs(offset) > height * mermaidPreparationViewports
                  ? 3
                  : Math.sign(offset) === direction
                    ? 1
                    : 2;
        if (
            nextRank < rank ||
            (nextRank === rank && Math.abs(offset) < distance)
        ) {
            rank = nextRank;
            distance = Math.abs(offset);
        }
    }
    return { rank, distance };
}
