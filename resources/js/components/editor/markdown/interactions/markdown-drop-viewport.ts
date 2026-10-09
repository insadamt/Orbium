import { syntaxTree } from '@codemirror/language';
import type { ChangeSet } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import {
    markdownBlockAt,
    type MarkdownBlockRange,
} from './markdown-block-actions';
import { markdownBlockElement } from './markdown-block-drag';

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
    const element = markdownBlockElement(view, block);
    const bottom = element?.getBoundingClientRect().bottom;
    const end = view.coordsAtPos(block.to)?.bottom;
    return bottom != null && end != null
        ? Math.max(bottom, end)
        : (bottom ?? end ?? null);
}

export function preserveMarkdownDropViewport(
    view: EditorView,
    request: MarkdownDropViewportRequest,
) {
    const above = blockAboveInsertion(view, request);
    const originalBottom = above && blockBottom(view, above);
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
    let mappedAbove: MarkdownBlockRange | null = null;
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
        const bottom = mappedAbove && blockBottom(view, mappedAbove);
        return bottom != null && originalBottom != null
            ? bottom - originalBottom
            : 0;
    };
    const restoreInsertionAnchor = () => {
        restoreOffsets();
        const correction = anchorCorrection();
        if (scrollContainer)
            scrollContainer.scrollTo({
                top: scrollContainer.scrollTop + correction / view.scaleY,
                behavior: 'instant',
            });
        else window.scrollBy({ top: correction, behavior: 'instant' });
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
        if (above)
            mappedAbove = {
                ...above,
                from: changes.mapPos(above.from, 1),
                to: changes.mapPos(above.to, -1),
            };
        restoreInsertionAnchor();
        // Keep content above the insertion line stationary after CodeMirror's deferred layout work.
        requestAnimationFrame(finishRestoration);
    } catch (error) {
        finishRestoration();
        throw error;
    }
}
