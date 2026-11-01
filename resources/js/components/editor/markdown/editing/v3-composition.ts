// Summary: Tracks composition across nested V3 rich inputs while allowing only the composing body's own writes; depends on owner DOM containment, stable block IDs and existing Mind Map portal markers.
import { EditorView, ViewPlugin } from '@codemirror/view';
import { v3StructureField } from '../structure/v3-structure-state';

type Composer = { target: Element; blockId: string | null };
const composing = new WeakMap<EditorView, Set<Composer>>();
function composingBlock(target: Element) {
    const widget = target.closest<HTMLElement>('[data-rich-from]');
    const host = (widget ?? target).closest<HTMLElement>('.cm-editor');
    const view = host && EditorView.findFromDOM(host);
    return (
        view?.state
            .field(v3StructureField, false)
            ?.current.blockAt(
                widget
                    ? Number(widget.dataset.richFrom)
                    : view.state.selection.main.head,
            )?.id ?? null
    );
}
export const v3CompositionTracking = ViewPlugin.define((view) => {
    const entries = new Set<Composer>();
    composing.set(view, entries);
    const start = (event: CompositionEvent) => {
        if (!(event.target instanceof Element)) return;
        for (const entry of entries)
            if (entry.target === event.target) entries.delete(entry);
        entries.add({
            target: event.target,
            blockId: composingBlock(event.target),
        });
    };
    const finish = (event: Event) => {
        for (const entry of entries)
            if (entry.target === event.target) entries.delete(entry);
    };
    view.dom.addEventListener('compositionstart', start, true);
    view.dom.addEventListener('compositionend', finish, true);
    view.dom.addEventListener('focusout', finish, true);
    return {
        destroy() {
            view.dom.removeEventListener('compositionstart', start, true);
            view.dom.removeEventListener('compositionend', finish, true);
            view.dom.removeEventListener('focusout', finish, true);
            if (composing.get(view) === entries) composing.delete(view);
        },
    };
});
export function isV3EmbeddedComposing(
    view: EditorView,
    options: { exceptEditor?: EditorView; exceptBlockId?: string } = {},
) {
    const entries = [...(composing.get(view) ?? [])];
    for (const target of view.dom.querySelectorAll<HTMLElement>(
        '[data-mindmap-composing="true"]',
    ))
        entries.push({ target, blockId: composingBlock(target) });
    return entries.some(
        (entry) =>
            entry.target.isConnected &&
            !options.exceptEditor?.dom.contains(entry.target) &&
            (!options.exceptBlockId || options.exceptBlockId !== entry.blockId),
    );
}
