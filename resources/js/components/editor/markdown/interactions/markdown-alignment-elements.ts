import type { EditorView } from '@codemirror/view';

export function markdownAlignmentElements(
    view: EditorView,
    position: number,
    blockFrom: number,
): HTMLElement[] {
    const rich = view.contentDOM.querySelector<HTMLElement>(
        `[data-rich-from="${blockFrom}"]`,
    );
    if (rich && rich.dataset.richKind !== 'inline-math') {
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
