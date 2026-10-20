import { EditorView } from '@codemirror/view';
import { markdownBlockAt } from '@/components/editor/markdown/interactions/markdown-block-actions';

export type BoardDocumentAnchor = { from: number; offset: number };

function viewportScale(viewport: HTMLElement) {
    return (
        viewport.getBoundingClientRect().height /
            (viewport.offsetHeight || 1) || 1
    );
}

function documentEditor(viewport: HTMLElement) {
    const content = viewport.querySelector<HTMLElement>('.cm-content');
    return content ? EditorView.findFromDOM(content) : null;
}

function editorBlockTop(view: EditorView, from: number) {
    return (
        view.coordsAtPos(from)?.top ??
        view.documentTop + view.lineBlockAt(from).top * view.scaleY
    );
}

export function captureBoardDocumentAnchor(
    viewport: HTMLElement,
): BoardDocumentAnchor | null {
    const bounds = viewport.getBoundingClientRect();
    const view = documentEditor(viewport);
    const candidates = viewport.querySelectorAll<HTMLElement>(
        view ? '.cm-content > *' : '[data-document-from]',
    );
    for (const element of candidates) {
        const blockBounds = element.getBoundingClientRect();
        if (
            blockBounds.bottom <= bounds.top + 2 ||
            blockBounds.top >= bounds.bottom
        )
            continue;
        if (
            !element.textContent?.trim() &&
            !element.querySelector('img, canvas, svg, video, audio, table')
        )
            continue;
        if (view) {
            const position = Number(
                element.dataset.richFrom ?? view.posAtDOM(element),
            );
            const block = markdownBlockAt(view.state, position);
            return {
                from: block.from,
                offset:
                    (editorBlockTop(view, block.from) - bounds.top) /
                    viewportScale(viewport),
            };
        }
        return {
            from: Number(element.dataset.documentFrom),
            offset: (blockBounds.top - bounds.top) / viewportScale(viewport),
        };
    }
    return null;
}

export function restoreBoardDocumentAnchor(
    viewport: HTMLElement,
    anchor: BoardDocumentAnchor | null,
) {
    if (!anchor) return;
    const view = documentEditor(viewport);
    let top: number | undefined;
    if (view) {
        top = editorBlockTop(
            view,
            Math.min(anchor.from, view.state.doc.length),
        );
    } else {
        const block = [
            ...viewport.querySelectorAll<HTMLElement>('[data-document-from]'),
        ].find(
            (element) =>
                Number(element.dataset.documentFrom) <= anchor.from &&
                Number(element.dataset.documentTo) > anchor.from,
        );
        top = block?.getBoundingClientRect().top;
    }
    if (top === undefined) return;
    viewport.scrollTo({
        top:
            viewport.scrollTop +
            (top - viewport.getBoundingClientRect().top) /
                viewportScale(viewport) -
            anchor.offset,
        behavior: 'instant',
    });
    view?.requestMeasure();
}

export function focusBoardDocumentAtPoint(
    viewport: HTMLElement,
    point: { x: number; y: number } | null,
    anchor: BoardDocumentAnchor | null,
) {
    const view = documentEditor(viewport);
    if (!view || view.state.readOnly) return;
    const position =
        (point ? view.posAtCoords(point) : null) ?? anchor?.from ?? 0;
    view.dispatch({
        selection: { anchor: Math.min(position, view.state.doc.length) },
    });
    //
    // Browser focus must not undo the visible-block restoration by scrolling to the old initial caret.
    //
    view.contentDOM.focus({ preventScroll: true });
}
