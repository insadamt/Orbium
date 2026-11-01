// Summary: Synchronizes the logical V3 caret when a dedicated rich input receives focus; depends on scoped widget ranges and deferred selection dispatch so empty-row cleanup runs without moving native input focus.
import { ViewPlugin } from '@codemirror/view';
import { v3StructureField } from '../structure/v3-structure-state';
import { v3BlockSelectionField } from '../editing/v3-block-selection';

export const v3RichBlockFocus = ViewPlugin.define((view) => {
    let destroyed = false;
    const focus = () => {
        //
        // Widget activation can occur during an owner update; wait until the browser and column projection have settled before dispatching.
        //
        queueMicrotask(() => {
            if (destroyed || !view.dom.isConnected) return;
            const target = view.root.activeElement;
            if (
                !(target instanceof HTMLElement) ||
                !target.matches(
                    'textarea, input, [contenteditable="true"], [data-rich-from]',
                ) ||
                view.state.field(v3BlockSelectionField, false)
            )
                return;
            const widget = target.closest<HTMLElement>('[data-rich-from]');
            //
            // Dedicated code editors may be nested CodeMirror views; ownership comes from their rich wrapper. Column layouts delegate child focus to the child's own projection instead.
            //
            if (
                !widget ||
                widget.closest('.cm-editor') !== view.dom ||
                widget.classList.contains('orbium-columns-block')
            )
                return;
            const position = Number(widget.dataset.richFrom);
            if (!Number.isFinite(position)) return;
            const index = view.state.field(v3StructureField).current;
            const block = index.blockAt(position);
            if (
                !block ||
                index.blockAt(view.state.selection.main.head)?.id === block.id
            )
                return;
            view.dispatch({
                selection: { anchor: block.bodyFrom },
                userEvent: 'select.v3.rich-focus',
            });
        });
    };
    view.dom.addEventListener('focusin', focus);
    return {
        destroy() {
            destroyed = true;
            view.dom.removeEventListener('focusin', focus);
        },
    };
});
