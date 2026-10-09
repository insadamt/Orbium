import { syntaxTree } from '@codemirror/language';
import type { EditorView } from '@codemirror/view';
import {
    markdownBlockAt,
    markdownBlockPresentation,
    type MarkdownBlockRange,
} from './markdown-block-actions';
import { logicalMarkdownText } from './markdown-logical-text';
import { Text } from '@codemirror/state';

export function markdownBlockElement(
    view: EditorView,
    block: MarkdownBlockRange,
) {
    const widget = view.dom.querySelector<HTMLElement>(
        `[data-rich-from="${block.from}"]`,
    );
    if (widget) return widget;
    let element = view.domAtPos(
        markdownBlockPresentation(view, block).contentFrom,
    ).node.parentElement;
    if (!element || !view.contentDOM.contains(element)) return null;
    while (
        element?.parentElement &&
        element.parentElement !== view.contentDOM &&
        view.contentDOM.contains(element.parentElement)
    )
        element = element.parentElement;
    if (!element || element === view.contentDOM) return null;
    return element.classList.contains('orbium-markdown-block-layout')
        ? (element.firstElementChild as HTMLElement | null)
        : element;
}

export function markdownBlockControlTop(
    view: EditorView,
    block: MarkdownBlockRange,
    controlHeight: number,
): number | null {
    const element = markdownBlockElement(view, block);
    const origin = view.dom.getBoundingClientRect().top;
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
    const row =
        element.querySelector<HTMLElement>(
            '[data-block-gutter-anchor]:not([hidden])',
        ) ?? element.querySelector<HTMLElement>('table tr');
    if (row && row.getBoundingClientRect().height > 0) {
        const bounds = row.getBoundingClientRect();
        return (
            (bounds.top - origin) / view.scaleY +
            (bounds.height / view.scaleY - controlHeight) / 2
        );
    }
    let firstLine = element.matches('.cm-line')
        ? element
        : (element.querySelector<HTMLElement>(
              '.cm-line, p:not([hidden]), summary, li',
          ) ?? element);
    if (!firstLine.getBoundingClientRect().height) firstLine = element;
    const style = getComputedStyle(firstLine);
    const lineHeight = Number.parseFloat(style.lineHeight);
    return (
        (firstLine.getBoundingClientRect().top - origin) / view.scaleY +
        (Number.parseFloat(style.paddingTop) || 0) +
        (Number.isFinite(lineHeight) ? (lineHeight - controlHeight) / 2 : 0)
    );
}

type MarkdownDragPointer = {
    clientX: number;
    clientY: number;
    target: EventTarget | null;
};

export function markdownBlockDropTarget(
    view: EditorView,
    pointer: MarkdownDragPointer,
) {
    const widget =
        pointer.target instanceof Element
            ? pointer.target.closest<HTMLElement>('[data-rich-from]')
            : null;
    const content = view.contentDOM.getBoundingClientRect();
    const position = widget
        ? Number(widget.dataset.richFrom)
        : view.posAtCoords(
              {
                  x: Math.max(
                      content.left + 1,
                      Math.min(content.right - 1, pointer.clientX),
                  ),
                  y: pointer.clientY,
              },
              false,
          );
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
