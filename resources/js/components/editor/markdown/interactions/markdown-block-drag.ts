import { syntaxTree } from '@codemirror/language';
import type { EditorView } from '@codemirror/view';
import {
    markdownBlockAt,
    markdownBlockPresentation,
    type MarkdownBlockRange,
} from './markdown-block-actions';
import { logicalMarkdownText } from './markdown-logical-text';
import { Text } from '@codemirror/state';
import { markdownBlockHoverPosition } from './markdown-block-hover-position';

export function markdownBlockElement(
    view: EditorView,
    block: MarkdownBlockRange,
) {
    const widget = view.dom.querySelector<HTMLElement>(
        `[data-rich-from="${block.from}"]`,
    );
    const { node } = view.domAtPos(
        markdownBlockPresentation(view, block).contentFrom,
    );
    let element =
        widget ?? (node instanceof HTMLElement ? node : node.parentElement);
    if (!element || !view.contentDOM.contains(element)) return null;
    while (
        element?.parentElement &&
        element.parentElement !== view.contentDOM &&
        view.contentDOM.contains(element.parentElement)
    )
        element = element.parentElement;
    if (!element || element === view.contentDOM) return null;
    return element;
}

export function markdownBlockControlTop(
    view: EditorView,
    block: MarkdownBlockRange,
    controlHeight: number,
): number | null {
    const element = markdownBlockElement(view, block);
    const origin =
        view.dom.getBoundingClientRect().top + view.dom.clientTop * view.scaleY;
    if (!element) {
        const coordinates = view.coordsAtPos(
            markdownBlockPresentation(view, block).contentFrom,
        );
        return coordinates
            ? (coordinates.top - origin) / view.scaleY +
                  (coordinates.bottom - coordinates.top) / view.scaleY / 2 -
                  controlHeight / 2
            : null;
    }
    // Choose by screen position: a nested toolbar may be below the container's first line.
    const candidates = [
        element,
        ...element.querySelectorAll<HTMLElement>(
            '[data-block-gutter-anchor], table tr, .cm-line, p, summary, li, .orbium-rich-block',
        ),
    ]
        .flatMap((candidate) => {
            const bounds = candidate.getBoundingClientRect();
            const style = getComputedStyle(candidate);
            if (
                !bounds.height ||
                style.visibility === 'hidden' ||
                candidate.closest('[hidden]')
            )
                return [];
            if (
                candidate === element &&
                !candidate.matches('.cm-line, .orbium-rich-block')
            )
                return [];
            const inset =
                (Number.parseFloat(style.borderTopWidth) || 0) +
                (Number.parseFloat(style.paddingTop) || 0);
            return [
                {
                    candidate,
                    style,
                    top: bounds.top + inset * view.scaleY,
                    bounds,
                },
            ];
        })
        .sort((left, right) => left.top - right.top);
    const first = candidates[0];
    if (!first)
        return (element.getBoundingClientRect().top - origin) / view.scaleY;
    const lineHeight =
        Number.parseFloat(first.style.lineHeight) || view.defaultLineHeight;
    const firstRowHeight = first.candidate.matches('[data-block-gutter-anchor]')
        ? Math.min(first.bounds.height / view.scaleY, 32)
        : lineHeight;
    return (
        (first.top - origin) / view.scaleY +
        (firstRowHeight - controlHeight) / 2
    );
}

type MarkdownDragPointer = {
    clientX: number;
    clientY: number;
};

export function markdownBlockDropTarget(
    view: EditorView,
    pointer: MarkdownDragPointer,
) {
    const position = markdownBlockHoverPosition(view, pointer);
    if (position === null || !Number.isFinite(position)) return null;
    let block = markdownBlockAt(view.state, position);
    if (!block.source.trim()) {
        const tree = syntaxTree(view.state).topNode;
        const previous = tree.childBefore(position);
        const next = tree.childAfter(position);
        const previousBottom =
            previous && view.coordsAtPos(previous.to)?.bottom;
        const nextTop = next && view.coordsAtPos(next.from)?.top;
        const neighbor =
            previous && next && previousBottom != null && nextTop != null
                ? pointer.clientY < (previousBottom + nextTop) / 2
                    ? previous
                    : next
                : (previous ?? next);
        if (neighbor) block = markdownBlockAt(view.state, neighbor.from);
    }
    const element = markdownBlockElement(view, block);
    const bounds = element?.getBoundingClientRect();
    const start = view.coordsAtPos(block.from);
    const end = view.coordsAtPos(block.to);
    // A multi-line source block spans several cm-line elements.
    const top =
        bounds && start
            ? Math.min(bounds.top, start.top)
            : (bounds?.top ?? start?.top);
    const bottom =
        bounds && end
            ? Math.max(bounds.bottom, end.bottom)
            : (bounds?.bottom ?? end?.bottom);
    if (top === undefined || bottom === undefined) return null;
    const placement =
        pointer.clientY < (top + bottom) / 2
            ? ('before' as const)
            : ('after' as const);
    return {
        block,
        placement,
        top: placement === 'before' ? top - 4 : bottom + 4,
    };
}

export function createMarkdownBlockDragPreview(block: MarkdownBlockRange) {
    const preview = document.createElement('div');
    preview.className = 'editor-block-drag-preview';
    preview.textContent =
        logicalMarkdownText(Text.of(block.source.split('\n')))
            .text.trim()
            .slice(0, 90) || 'Empty block';
    document.body.append(preview);
    return preview;
}
