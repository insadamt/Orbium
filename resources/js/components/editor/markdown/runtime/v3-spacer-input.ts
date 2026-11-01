// Summary: Gives blank spacers a native writing cursor and promotes their first committed text into owner content; depends on checked spacer-writing operations, shared block selection and browser composition events.
import { EditorView } from '@codemirror/view';
import { startCompletion } from '@codemirror/autocomplete';
import { v3SpacerWritingOperation } from '../editing/v3-spacer-writing';
import {
    v3BlockSelectionField,
    v3BlockSelectionTransaction,
} from '../editing/v3-block-selection';
import { v3StructureField } from '../structure/v3-structure-state';
import {
    dispatchV3ProductOperation,
    insertV3ParagraphAfter,
    selectedV3ProductIds,
} from './v3-product-commands';

export function createV3SpacerInput(view: EditorView, blockId: string) {
    const input = document.createElement('textarea');
    input.className =
        'orbium-spacer-input block w-full resize-none border-0 bg-transparent p-0 font-inherit text-inherit outline-none';
    input.rows = 1;
    input.dir = 'auto';
    input.style.font = 'inherit';
    input.style.lineHeight = 'inherit';
    input.style.overflow = 'hidden';
    input.setAttribute('aria-label', 'Empty block. Type to write.');
    let composing = false;
    const editable = () =>
        view.state.facet(EditorView.editable) && !view.state.readOnly;
    input.readOnly = !editable();

    function publishText() {
        if (composing || !input.isConnected || !editable() || !input.value)
            return;
        try {
            if (
                view.state.field(v3StructureField).current.blockById(blockId)
                    ?.type !== 'spacer'
            )
                return;
            const operation = v3SpacerWritingOperation(blockId, input.value);
            if (!operation) return;
            dispatchV3ProductOperation(view, operation);
            if (input.value === '/')
                queueMicrotask(() => {
                    const host =
                        view.root.activeElement?.closest<HTMLElement>(
                            '.cm-editor',
                        );
                    const activeView = host && EditorView.findFromDOM(host);
                    if (activeView === view && view.dom.isConnected)
                        startCompletion(view);
                });
        } catch (error) {
            //
            // Keep rejected text in the input so the user can copy or retry it instead of silently losing the draft.
            //
            input.dataset.unsavedRichDraft = 'true';
            input.setCustomValidity(
                error instanceof Error
                    ? error.message
                    : 'Unable to write this block.',
            );
            input.reportValidity();
        }
    }

    input.addEventListener('focus', () => {
        input.readOnly = !editable();
        if (!view.state.field(v3BlockSelectionField)?.ids.includes(blockId)) {
            const selection = v3BlockSelectionTransaction(view.state, blockId);
            //
            // Moving a spacer already places its logical caret. Native input focus must not replace it with a range and cancel the pending move animation.
            //
            const caretBlock = view.state
                .field(v3StructureField)
                .current.blockAt(view.state.selection.main.head);
            view.dispatch(
                view.state.selection.main.empty && caretBlock?.id === blockId
                    ? { effects: selection.effects }
                    : selection,
            );
        }
    });
    input.addEventListener('beforeinput', (event) => {
        if (!editable()) event.preventDefault();
    });
    input.addEventListener('compositionstart', () => {
        composing = true;
    });
    input.addEventListener('compositionend', () => {
        composing = false;
        //
        // Wait for the browser's final input event before replacing the composing DOM with ordinary editor text.
        //
        queueMicrotask(publishText);
    });
    input.addEventListener('input', (event) => {
        input.setCustomValidity('');
        if (!input.value) delete input.dataset.unsavedRichDraft;
        if (!(event as InputEvent).isComposing) publishText();
    });
    input.addEventListener('keydown', (event) => {
        if (event.isComposing || composing) return;
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        event.stopPropagation();
        if (!['Enter', 'Backspace', 'Delete'].includes(event.key)) return;
        if (input.value) {
            if (event.key === 'Enter') {
                event.preventDefault();
                publishText();
            }
            return;
        }
        event.preventDefault();
        if (!editable()) return;
        if (event.key === 'Enter')
            insertV3ParagraphAfter(view, blockId, { motion: 'none' });
        else
            dispatchV3ProductOperation(view, {
                kind: 'delete',
                blockIds: selectedV3ProductIds(view, blockId),
                ensureParagraph: true,
                motion: 'none',
            });
    });
    return input;
}
