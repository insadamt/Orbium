// Summary: Resolves pointers to owning document/column blocks and identified blank spacers; depends on scoped DOM ownership and the V3 index so atomic empty widgets cannot resolve to a neighbor.
import type { EditorView } from '@codemirror/view';
import { v3StructureField } from '../structure/v3-structure-state';

type MarkdownBlockPointer = { clientX: number; clientY: number };

export function markdownBlockPointerTarget(
    view: EditorView,
    pointer: MarkdownBlockPointer,
) {
    const bounds = view.dom.getBoundingClientRect();
    const surface = view.dom.closest('.floating-document-island');
    const left = surface?.getBoundingClientRect().left ?? bounds.left - 52;
    if (
        pointer.clientY < bounds.top ||
        pointer.clientY > bounds.bottom ||
        pointer.clientX < left ||
        pointer.clientX > bounds.right
    )
        return null;

    const content = view.contentDOM.getBoundingClientRect();
    const x = Math.max(
        content.left + 1,
        Math.min(content.right - 1, pointer.clientX),
    );
    const target = view.dom.ownerDocument.elementFromPoint(x, pointer.clientY);
    return target && view.contentDOM.contains(target) ? target : null;
}

export function markdownBlockHoverPosition(
    view: EditorView,
    pointer: MarkdownBlockPointer,
): number | null {
    const target = markdownBlockPointerTarget(view, pointer);
    if (!target) return null;
    if (target.closest('.cm-editor') !== view.dom) {
        // A nested column editor belongs to the outer columns block, not to
        // the parent editor's previous selection or an unrelated text block.
        const columns = target.closest<HTMLElement>(
            '.orbium-columns-block[data-rich-from]',
        );
        if (
            !columns ||
            columns.closest('.cm-editor') !== view.dom ||
            !view.contentDOM.contains(columns)
        )
            return null;
        const from = Number(columns.dataset.richFrom);
        return Number.isFinite(from) ? from : null;
    }
    const spacerId = target.closest<HTMLElement>('[data-v3-spacer-id]')?.dataset
        .v3SpacerId;
    if (spacerId) {
        const spacer = view.state
            .field(v3StructureField, false)
            ?.current.blockById(spacerId);
        if (spacer?.type === 'spacer') return spacer.bodyFrom;
    }
    const layout = target.closest('.orbium-markdown-block-layout');
    const emptyLine =
        target.closest<HTMLElement>('[data-v3-empty-block-id]') ??
        layout?.querySelector<HTMLElement>('[data-v3-empty-block-id]');
    if (emptyLine?.closest('.cm-editor') === view.dom) {
        const id = emptyLine.dataset.v3EmptyBlockId;
        const block = id
            ? view.state.field(v3StructureField, false)?.current.blockById(id)
            : null;
        if (block?.type === 'paragraph') return block.bodyFrom;
    }
    // Wrapper starts remain unambiguous even in widget padding and lower halves.
    if (layout && view.contentDOM.contains(layout))
        return view.posAtDOM(layout, 0);
    const widget = target.closest<HTMLElement>('[data-rich-from]');
    return widget && view.contentDOM.contains(widget)
        ? Number(widget.dataset.richFrom)
        : view.posAtCoords({ x: pointer.clientX, y: pointer.clientY });
}
