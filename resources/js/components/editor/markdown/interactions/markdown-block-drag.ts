// Summary: Measures block surfaces and reorder targets without confusing nested editor offsets; depends on CodeMirror source positions and block presentation.
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
    const widget = [
        ...view.dom.querySelectorAll<HTMLElement>(
            `[data-rich-from="${block.from}"]`,
        ),
    ].find((element) => element.closest('.cm-editor') === view.dom);
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
    if (element) {
        const bounds = element.getBoundingClientRect();
        if (bounds.height) {
            // Every block uses its measured outer layout wrapper. Read only
            // that wrapper's inset: internal heading, callout, table and media
            // padding must not shift the drag handle independently.
            const wrapper = element.matches('.orbium-markdown-block-layout');
            const style = wrapper ? getComputedStyle(element) : null;
            const inset = style
                ? (Number.parseFloat(style.borderTopWidth) || 0) +
                  (Number.parseFloat(style.paddingTop) || 0)
                : 0;
            return (
                (bounds.top - origin) / view.scaleY +
                inset +
                (Math.min(view.defaultLineHeight, 32) - controlHeight) / 2
            );
        }
    }
    const coordinates = view.coordsAtPos(
        markdownBlockPresentation(view, block).contentFrom,
    );
    return coordinates
        ? (coordinates.top - origin) / view.scaleY +
              (coordinates.bottom - coordinates.top) / view.scaleY / 2 -
              controlHeight / 2
        : null;
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
