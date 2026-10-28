import { Plugin, type EditorState } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { mountInlineIconPointerSelection } from './inline-icon-pointer-selection';

function selectedInlineIconDecorations(state: EditorState) {
    const decorations: Decoration[] = [];
    if (state.selection.empty || !state.selection.visible)
        return DecorationSet.empty;
    for (const range of state.selection.ranges) {
        state.doc.nodesBetween(
            range.$from.pos,
            range.$to.pos,
            (node, position) => {
                if (node.type.name === 'inlineIcon')
                    decorations.push(
                        Decoration.node(position, position + node.nodeSize, {
                            class: 'orbium-inline-icon-in-selection',
                        }),
                    );
                return !node.isInline;
            },
        );
    }
    return DecorationSet.create(state.doc, decorations);
}

export function createInlineIconSelectionPlugin() {
    return new Plugin<DecorationSet>({
        view: mountInlineIconPointerSelection,
        state: {
            init: (_, state) => selectedInlineIconDecorations(state),
            apply: (transaction, decorations, _previous, state) =>
                transaction.docChanged || transaction.selectionSet
                    ? selectedInlineIconDecorations(state)
                    : decorations,
        },
        props: {
            attributes: { 'data-inline-icon-editor': '' },
            decorations(state) {
                return this.getState(state);
            },
        },
    });
}
