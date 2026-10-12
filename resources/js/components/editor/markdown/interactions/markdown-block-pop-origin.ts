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
    // Full-width row boxes include empty space that would pull text sideways during scaling.
    const range = document.createRange();
    for (const element of elements) {
        const text = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        let node: Node | null;
        while ((node = text.nextNode())) {
            if (!node.textContent?.trim()) continue;
            range.selectNodeContents(node);
            for (const bounds of range.getClientRects())
                includeVisibleBounds(bounds);
        }
        for (const media of element.querySelectorAll(
            'img, svg, video, canvas, table, hr, .cm-md-divider',
        ))
            includeVisibleBounds(media.getBoundingClientRect());
    }
    if (!Number.isFinite(left)) return 'center center';
    const centerX = (left + right) / 2;
    const centerY = (top + bottom) / 2;
    return `${(centerX - origin.left) / view.scaleX}px ${(centerY - origin.top) / view.scaleY}px`;
}
