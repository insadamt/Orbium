import { syntaxTree } from '@codemirror/language';
import type { ChangeSet } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import {
    markdownBlockAt,
    type MarkdownBlockRange,
} from './markdown-block-actions';
import { markdownBlockElement } from './markdown-block-drag';
import { markdownDragViewport } from './markdown-drag-scroll';

type ScrollPosition = {
    element: HTMLElement;
    top: number;
    left: number;
    overflowAnchor: string;
};

type MarkdownDropViewportRequest = {
    draggedBlock: MarkdownBlockRange;
    targetBlock: MarkdownBlockRange;
    placement: 'before' | 'after';
    moveBlock: () => ChangeSet | undefined;
};

function blockAboveInsertion(
    view: EditorView,
    request: MarkdownDropViewportRequest,
) {
    if (request.placement === 'after') return request.targetBlock;
    let previous = syntaxTree(view.state).topNode.childBefore(
        request.targetBlock.from,
    );
    while (
        previous &&
        previous.from >= request.draggedBlock.from &&
        previous.to <= request.draggedBlock.to
    )
        previous = previous.prevSibling;
    return previous ? markdownBlockAt(view.state, previous.from) : null;
}

function blockBottom(view: EditorView, block: MarkdownBlockRange) {
    const bottom = markdownBlockElement(view, block)?.getBoundingClientRect()
        .bottom;
    const sourceBottom = view.coordsAtPos(block.to)?.bottom;
    return bottom != null && sourceBottom != null
        ? Math.max(bottom, sourceBottom)
        : (bottom ?? sourceBottom ?? null);
}

export function preserveMarkdownDropViewport(
    view: EditorView,
    request: MarkdownDropViewportRequest,
) {
    const anchor = blockAboveInsertion(view, request);
    const originalCoordinate = anchor && blockBottom(view, anchor);
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
    let mappedAnchor: MarkdownBlockRange | null = null;
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
    const anchorCorrection = () => {
        const coordinate = mappedAnchor && blockBottom(view, mappedAnchor);
        return coordinate != null && originalCoordinate != null
            ? coordinate - originalCoordinate
            : 0;
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
    const restoreInsertionAnchor = () => {
        restoreOffsets();
        scrollByScreenDistance(anchorCorrection());
        // Keep the beginning visible when a boundary falls at the pane edge.
        keepMovedBlockTopVisible();
    };
    let restored = false;
    const finishRestoration = () => {
        if (restored) return;
        restored = true;
        restoreInsertionAnchor();
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
        if (anchor)
            mappedAnchor = {
                ...anchor,
                from: changes.mapPos(anchor.from, 1),
                to: changes.mapPos(anchor.to, -1),
            };
        restoreInsertionAnchor();
        // Keep content above the insertion line stationary after CodeMirror's deferred layout work.
        requestAnimationFrame(finishRestoration);
    } catch (error) {
        finishRestoration();
        throw error;
    }
}
