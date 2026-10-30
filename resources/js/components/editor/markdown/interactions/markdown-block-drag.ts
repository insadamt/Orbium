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

    // CodeMirror renders an empty editor's prompt as a placeholder widget,
    // not an ordinary text line. Align the grip to the rendered prompt's
    // first text rect rather than estimating from the editor's line height.
    if (!block.source.trim()) {
        const placeholder = view.contentDOM.querySelector<HTMLElement>(
            '.cm-placeholder',
        );
        if (
            placeholder &&
            placeholder.closest('.cm-editor') === view.dom
        ) {
            const range = view.dom.ownerDocument.createRange();
            range.selectNodeContents(placeholder);
            const bounds =
                [...range.getClientRects()].find(
                    (rect) => rect.width > 0 && rect.height > 0,
                ) ?? placeholder.getBoundingClientRect();
            if (bounds.height) {
                return (
                    (bounds.top + bounds.height / 2 - origin) / view.scaleY -
                    controlHeight / 2
                );
            }
        }
    }
    if (element) {
        const rich = element.matches('.orbium-rich-block[data-rich-from]')
            ? element
            : element.querySelector<HTMLElement>(
                  `.orbium-rich-block[data-rich-from="${block.from}"]`,
              );
        // The outer columns grip must never follow text in a child editor.
        // Its own gutter is responsible for the individual column blocks.
        if (rich?.classList.contains('orbium-columns-block')) {
            const bounds = rich.getBoundingClientRect();
            return (
                (bounds.top + Math.min(view.defaultLineHeight / 2, 16) * view.scaleY - origin) /
                    view.scaleY -
                controlHeight / 2
            );
        }

        // An image's optional caption is not its block handle anchor.
        if (rich?.classList.contains('orbium-image')) {
            const image = rich.querySelector('img');
            if (image) {
                const bounds = image.getBoundingClientRect();
                if (bounds.height)
                    return (
                        (bounds.top +
                            Math.min(view.defaultLineHeight / 2, 16) *
                                view.scaleY -
                            origin) /
                            view.scaleY -
                        controlHeight / 2
                    );
            }
        }

        // Match the *visible first line*, not the wrapper's generic line
        // height. This accounts for large headings, callout padding and RTL
        // text without moving the underlying block or changing its styling.
        const walker = element.ownerDocument.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
        );
        const range = element.ownerDocument.createRange();
        let node: Node | null;
        let inspected = 0;
        while ((node = walker.nextNode()) && inspected++ < 80) {
            if (!node.textContent?.trim()) continue;
            const parent = node.parentElement;
            if (
                !parent ||
                parent.closest('.cm-editor') !== view.dom ||
                parent.closest(
                    '[hidden], [aria-hidden="true"], button, [role="toolbar"], [data-block-controls], .cm-gutters, .cm-tooltip',
                )
            )
                continue;
            const style = getComputedStyle(parent);
            if (
                style.display === 'none' ||
                style.visibility !== 'visible'
            )
                continue;
            range.selectNodeContents(node);
            const firstLine = [...range.getClientRects()].find(
                (rect) => rect.height > 0 && rect.width > 0,
            );
            if (firstLine) {
                return (
                    (firstLine.top + firstLine.height / 2 - origin) /
                        view.scaleY -
                    controlHeight / 2
                );
            }
        }

        // Media and other non-text blocks have no first text line. Anchor
        // beside their visible top edge, not at the center of a tall widget.
        const media = element.querySelector<HTMLElement>(
            'img, video, canvas, .orbium-rich-table, .cm-md-divider',
        );
        const surface = media?.closest('.cm-editor') === view.dom
            ? media
            : (rich ?? element);
        const bounds = surface.getBoundingClientRect();
        if (bounds.height)
            return (
                (bounds.top + Math.min(view.defaultLineHeight / 2, 16) * view.scaleY - origin) /
                    view.scaleY -
                controlHeight / 2
            );
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
