// Summary: Gives empty identified paragraphs the same measured frame as typed text and a non-content writing hint; depends on V3 body ranges, block wrappers and line attributes so placeholders cannot alter caret geometry.
import { StateField, type EditorState, type Range } from '@codemirror/state';
import { BlockWrapper, Decoration, EditorView } from '@codemirror/view';
import { v3StructureField } from '../structure/v3-structure-state';

function collectEmptyParagraphFrames(state: EditorState) {
    const index = state.field(v3StructureField).current;
    const wrappers: Range<BlockWrapper>[] = [];
    const lines: Range<Decoration>[] = [];
    if (index.valid)
        for (const block of index.blocksIn(null)) {
            if (
                block.type !== 'paragraph' ||
                state.sliceDoc(block.bodyFrom, block.bodyTo).trim()
            )
                continue;
            const firstLine = state.doc.lineAt(block.bodyFrom);
            //
            // A raw header without a body newline is still metadata, not a visible empty line to wrap.
            //
            if (firstLine.from !== block.bodyFrom) continue;
            const lastLine = state.doc.lineAt(
                Math.max(block.bodyFrom, block.bodyTo - 1),
            );
            //
            // Empty bodies have no syntax node, so the syntax-based wrapper service cannot supply the frame they acquire on their first keystroke.
            //
            wrappers.push(
                BlockWrapper.create({
                    tagName: 'div',
                    attributes: { class: 'orbium-markdown-block-layout' },
                    rank: 100,
                }).range(firstLine.from, lastLine.to),
            );
            lines.push(
                Decoration.line({
                    attributes: {
                        class: 'cm-v3-empty-paragraph',
                        'data-v3-empty-block-id': block.id,
                    },
                }).range(firstLine.from),
            );
        }
    return {
        wrappers: BlockWrapper.set(wrappers, true),
        emptyLines: Decoration.set(lines, true),
    };
}

function emptyParagraphs(
    state: EditorState,
    frames = collectEmptyParagraphFrames(state),
) {
    const selection = state.selection.main;
    const active = selection.empty
        ? state.field(v3StructureField).current.blockAt(selection.head)
        : null;
    const decorations =
        active?.type === 'paragraph' &&
        active.parentId === null &&
        state.doc.lineAt(active.bodyFrom).from === active.bodyFrom &&
        !state.sliceDoc(active.bodyFrom, active.bodyTo).trim()
            ? frames.emptyLines.update({
                  add: [
                      Decoration.line({
                          attributes: {
                              'data-v3-placeholder': 'Write, or press /…',
                          },
                      }).range(active.bodyFrom),
                  ],
              })
            : frames.emptyLines;
    return { ...frames, decorations };
}

export const v3EmptyParagraphs = StateField.define({
    create: emptyParagraphs,
    update(previous, transaction) {
        if (transaction.docChanged) return emptyParagraphs(transaction.state);
        return transaction.selection
            ? emptyParagraphs(transaction.state, previous)
            : previous;
    },
    provide: (field) => [
        EditorView.decorations.from(field, (value) => value.decorations),
        EditorView.blockWrappers.from(field, (value) => value.wrappers),
    ],
});
