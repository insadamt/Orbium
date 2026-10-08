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

export function markdownBlockDropTarget(view: EditorView, event: DragEvent) {
    const widget =
        event.target instanceof Element
            ? event.target.closest<HTMLElement>('[data-rich-from]')
            : null;
    const position = widget
        ? Number(widget.dataset.richFrom)
        : view.posAtCoords({ x: event.clientX, y: event.clientY });
    if (position === null) return null;
    const block = markdownBlockAt(view.state, position);
    const element = markdownBlockElement(view, block);
    const bounds = element?.getBoundingClientRect();
    const start = view.coordsAtPos(block.from);
    const end = view.coordsAtPos(block.to);
    const top = bounds?.top ?? start?.top;
    const bottom = bounds?.bottom ?? end?.bottom;
    if (top === undefined || bottom === undefined) return null;
    const placement =
        event.clientY < (top + bottom) / 2
            ? ('before' as const)
            : ('after' as const);
    return {
        block,
        placement,
        top:
            (placement === 'before' ? top - 4 : bottom + 4) -
            view.dom.getBoundingClientRect().top,
    };
}

export function showMarkdownBlockDragPreview(
    event: DragEvent,
    block: MarkdownBlockRange,
) {
    const preview = document.createElement('div');
    preview.className = 'editor-block-drag-preview';
    preview.textContent =
        logicalMarkdownText(Text.of(block.source.split('\n')))
            .text.trim()
            .slice(0, 90) || 'Empty block';
    document.body.append(preview);
    event.dataTransfer?.setDragImage(preview, 16, 16);
    setTimeout(() => preview.remove(), 0);
}
