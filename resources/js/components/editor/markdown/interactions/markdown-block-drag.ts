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
    return element && element !== view.contentDOM ? element : null;
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
