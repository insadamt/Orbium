import type { EditorView } from '@codemirror/view';

function calloutAlignmentElements(callout: HTMLElement) {
    const textRows = callout.querySelectorAll<HTMLElement>(
        'summary, [data-rich-writing] p, [data-rich-writing] h1, [data-rich-writing] h2, [data-rich-writing] h3, [data-rich-writing] h4, [data-rich-writing] h5, [data-rich-writing] h6, .cm-line',
    );

    // Move the writing surface, leaving the callout card and nested media in place.

    return Array.from(textRows).filter(
        (row) =>
            !row.closest('figure, table, pre, .attachment-player') &&
            Array.from(row.getClientRects()).some(
                (rect) => rect.width > 0 && rect.height > 0,
            ),
    );
}

export function markdownAlignmentElements(
    view: EditorView,
    position: number,
    blockFrom: number,
): HTMLElement[] {
    const rich = view.contentDOM.querySelector<HTMLElement>(
        `[data-rich-from="${blockFrom}"]`,
    );
    if (rich && rich.dataset.richKind !== 'inline-math') {
        if (rich.dataset.richKind === 'callout')
            return calloutAlignmentElements(rich);
        const figures = Array.from(
            rich.querySelectorAll<HTMLElement>('figure'),
        );
        return figures.length ? figures : [rich];
    }
    const node = view.domAtPos(position).node;
    const element = node instanceof Element ? node : node.parentElement;
    const layout = element?.closest('.orbium-markdown-block-layout');
    return layout
        ? Array.from(layout.querySelectorAll<HTMLElement>('.cm-line'))
        : [];
}
