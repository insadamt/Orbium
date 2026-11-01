// Summary: Renders identified empty-space blocks as blank writable rows; depends on native spacer inputs, owner commands and shared selection to promote writing without changing untouched spacing.
import { StateField, type EditorState } from '@codemirror/state';
import {
    Decoration,
    EditorView,
    ViewPlugin,
    WidgetType,
} from '@codemirror/view';
import { v3StructureField } from '../structure/v3-structure-state';
import { selectV3BlockFromHandle } from '../editing/v3-live-editing';
import { createV3SpacerInput } from './v3-spacer-input';
import {
    v3BlockSelectionField,
    v3BlockSelectionTransaction,
} from '../editing/v3-block-selection';

class V3Spacer extends WidgetType {
    constructor(readonly id: string) {
        super();
    }
    eq(other: V3Spacer) {
        return this.id === other.id;
    }
    get estimatedHeight() {
        return 40;
    }
    toDOM(view: EditorView) {
        const spacer = document.createElement('div');
        spacer.className = 'orbium-spacer-block';
        spacer.dataset.v3SpacerId = this.id;
        spacer.contentEditable = 'false';
        const input = createV3SpacerInput(view, this.id);
        spacer.append(input);
        spacer.addEventListener('pointerdown', (event) => {
            if (event.button !== 0) return;
            if (event.shiftKey) {
                event.preventDefault();
                selectV3BlockFromHandle(view, this.id, true);
                view.focus();
            } else {
                view.dispatch(v3BlockSelectionTransaction(view.state, this.id));
                if (event.target !== input) {
                    event.preventDefault();
                    input.focus({ preventScroll: true });
                }
            }
        });
        return spacer;
    }
    ignoreEvent() {
        return true;
    }
}

function spacers(state: EditorState) {
    const index = state.field(v3StructureField).current;
    return Decoration.set(
        index.valid
            ? index
                  .blocksIn(null)
                  .filter((block) => block.type === 'spacer')
                  .map((block) =>
                      Decoration.replace({
                          widget: new V3Spacer(block.id),
                          block: true,
                          inclusiveStart: true,
                          inclusiveEnd: false,
                      }).range(block.from, block.to),
                  )
            : [],
        true,
    );
}

const focusSpacerSelection = ViewPlugin.define((view) => {
    let destroyed = false;
    const focus = () =>
        queueMicrotask(() => {
            if (
                destroyed ||
                view.root.activeElement !== view.contentDOM ||
                view.state.field(v3BlockSelectionField)
            )
                return;
            const block = view.state
                .field(v3StructureField)
                .current.blockAt(view.state.selection.main.head);
            if (block?.type === 'spacer')
                view.dom
                    .querySelector<HTMLTextAreaElement>(
                        `[data-v3-spacer-id="${block.id}"] textarea`,
                    )
                    ?.focus({ preventScroll: true });
        });
    view.contentDOM.addEventListener('focus', focus);
    return {
        update(update) {
            if (update.selectionSet || update.docChanged) focus();
        },
        destroy() {
            destroyed = true;
            view.contentDOM.removeEventListener('focus', focus);
        },
    };
});

export const v3SpacerBlocks = StateField.define({
    create: spacers,
    update: (previous, transaction) =>
        transaction.docChanged ? spacers(transaction.state) : previous,
    provide: (field) => [
        EditorView.decorations.from(field),
        EditorView.atomicRanges.of((view) => view.state.field(field)),
        focusSpacerSelection,
    ],
});
