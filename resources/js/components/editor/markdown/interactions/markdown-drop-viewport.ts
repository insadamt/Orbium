import type { ChangeSet } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import type { MarkdownBlockRange } from './markdown-block-actions';
import { markdownDragViewport } from './markdown-drag-scroll';

type ScrollPosition = {
    element: HTMLElement;
    top: number;
    left: number;
    overflowAnchor: string;
};

type MarkdownDropViewportRequest = {
    targetBlock: MarkdownBlockRange;
    placement: 'before' | 'after';
    moveBlock: () => ChangeSet | undefined;
};

export function preserveMarkdownDropViewport(
    view: EditorView,
    request: MarkdownDropViewportRequest,
) {
    const positions: ScrollPosition[] = [];
    let scrollContainer: HTMLElement | null = null;
    for (
        let element: HTMLElement | null = view.scrollDOM;
        element;
        element = element.parentElement
    ) {
        positions.push({
            element,
            top: element.scrollTop,
            left: element.scrollLeft,
            overflowAnchor: element.style.overflowAnchor,
        });
        if (
            !scrollContainer &&
            element.scrollHeight > element.clientHeight &&
            /(auto|scroll)/.test(getComputedStyle(element).overflowY)
        )
            scrollContainer = element;
        element.style.overflowAnchor = 'none';
    }
    const windowPosition = { top: window.scrollY, left: window.scrollX };
    let movedBlockFrom: number | null = null;
    const restoreOffsets = () => {
        for (const position of positions)
            position.element.scrollTo({
                top: position.top,
                left: position.left,
                behavior: 'instant',
            });
        window.scrollTo({ ...windowPosition, behavior: 'instant' });
    };
    const scrollByScreenDistance = (distance: number) => {
        if (scrollContainer)
            scrollContainer.scrollTo({
                top: scrollContainer.scrollTop + distance / view.scaleY,
                behavior: 'instant',
            });
        else window.scrollBy({ top: distance, behavior: 'instant' });
    };
    const keepMovedBlockTopVisible = () => {
        if (movedBlockFrom === null) return;
        const widget = view.dom.querySelector<HTMLElement>(
            `[data-rich-from="${movedBlockFrom}"]`,
        );
        const top =
            widget?.getBoundingClientRect().top ??
            view.coordsAtPos(movedBlockFrom)?.top ??
            view.documentTop +
                view.lineBlockAt(movedBlockFrom).top * view.scaleY;
        const visiblePane = markdownDragViewport(view);
        const minimumTop = visiblePane.top + 12;
        const maximumTop = Math.max(
            minimumTop,
            visiblePane.bottom - view.defaultLineHeight * view.scaleY - 12,
        );
        const visibleTop = Math.max(minimumTop, Math.min(maximumTop, top));
        scrollByScreenDistance(top - visibleTop);
    };
    const restoreDropViewport = () => {
        restoreOffsets();
        keepMovedBlockTopVisible();
    };
    let restored = false;
    const finishRestoration = () => {
        if (restored) return;
        restored = true;
        restoreDropViewport();
        for (const position of positions)
            position.element.style.overflowAnchor = position.overflowAnchor;
    };
    try {
        const changes = request.moveBlock();
        if (!changes) {
            finishRestoration();
            return;
        }
        const destination =
            request.placement === 'before'
                ? request.targetBlock.from
                : request.targetBlock.to;
        movedBlockFrom =
            changes.mapPos(destination, -1) +
            (request.placement === 'before' ? 0 : 2);
        restoreDropViewport();
        // Both move directions retain offsets; only a clipped destination needs compensation.
        requestAnimationFrame(finishRestoration);
    } catch (error) {
        finishRestoration();
        throw error;
    }
}
