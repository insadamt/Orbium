import type { EditorView } from '@codemirror/view';

type BlockPopOriginRequest = {
    view: EditorView;
    elements: readonly HTMLElement[];
    origin: { left: number; top: number };
};

export function markdownBlockPopOrigin({
    view,
    elements,
    origin,
}: BlockPopOriginRequest) {
    let left = Infinity;
    let top = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;
    function includeVisibleBounds(bounds: DOMRect) {
        if (!bounds.width || !bounds.height) return;
        left = Math.min(left, bounds.left);
        top = Math.min(top, bounds.top);
        right = Math.max(right, bounds.right);
        bottom = Math.max(bottom, bounds.bottom);
    }
    const range = document.createRange();
    for (const element of elements) {
        // A card's surface is visible content too; its labels must not pull the origin to one side.
        const surfaceSelector =
            '.orbium-rich-block:not(.orbium-image), .editor-image-figure, blockquote';
        const surfaces = element.matches(surfaceSelector)
            ? [element]
            : Array.from(
                  element.querySelectorAll<HTMLElement>(surfaceSelector),
              );
        const visibleSurfaces = surfaces.filter(
            (surface) =>
                !surface.closest('[hidden]') &&
                surface.getBoundingClientRect().height > 0,
        );
        if (visibleSurfaces.length) {
            for (const surface of visibleSurfaces)
                includeVisibleBounds(surface.getBoundingClientRect());
            continue;
        }
        const text = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        let node: Node | null;
        while ((node = text.nextNode())) {
            const parent = node.parentElement;
            if (
                !node.textContent?.trim() ||
                !parent ||
                parent.closest(
                    '[hidden], style, script, textarea, .katex-mathml',
                ) ||
                getComputedStyle(parent).visibility === 'hidden'
            )
                continue;
            range.selectNodeContents(node);
            for (const bounds of range.getClientRects())
                includeVisibleBounds(bounds);
        }
        for (const media of element.querySelectorAll(
            'img, svg, video, canvas, table, hr, .cm-md-divider, .katex',
        )) {
            if (!media.closest('[hidden]'))
                includeVisibleBounds(media.getBoundingClientRect());
        }
    }
    if (!Number.isFinite(left)) return 'center center';
    const centerX = (left + right) / 2;
    const centerY = (top + bottom) / 2;
    return `${(centerX - origin.left) / view.scaleX}px ${(centerY - origin.top) / view.scaleY}px`;
}
