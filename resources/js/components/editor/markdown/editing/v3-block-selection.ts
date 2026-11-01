// Summary: Tracks whole-block/range selection and two-stage Select All inside one owner state; depends on V3 sibling identity and CodeMirror selection effects, keeping split panes independent.
import {
    EditorSelection,
    StateEffect,
    StateField,
    type EditorState,
    type TransactionSpec,
} from '@codemirror/state';
import { v3StructureField } from '../structure/v3-structure-state';
import { readV3EditableText } from './v3-editable-text';
import { v3TextPrefixLength } from './v3-text-prefix';
import { V3OperationError } from '../transactions/v3-transaction-types';

export type V3BlockSelection = {
    anchorId: string;
    headId: string;
    ids: readonly string[];
} | null;
export const v3SelectBlocks = StateEffect.define<V3BlockSelection>();
export const v3BlockSelectionField = StateField.define<V3BlockSelection>({
    create: () => null,
    update(previous, transaction) {
        for (const effect of transaction.effects)
            if (effect.is(v3SelectBlocks)) return effect.value;
        //
        // Content or caret edits retire the handle range instead of leaving a stale drag/cut target after undo or a source switch.
        //
        return transaction.docChanged || transaction.selection
            ? null
            : previous;
    },
});

export function v3BlockSelectionTransaction(
    state: EditorState,
    blockId: string,
    extend = false,
): TransactionSpec {
    const index = state.field(v3StructureField).current;
    const head = index.blockById(blockId);
    const previous = state.field(v3BlockSelectionField);
    const anchor =
        extend && previous ? index.blockById(previous.anchorId) : head;
    if (!head || !anchor || head.parentId !== anchor.parentId)
        throw new V3OperationError(
            'invalid-block-selection',
            'Select consecutive blocks within one document or column.',
        );
    const ids = index
        .blocksIn(head.parentId)
        .slice(
            Math.min(anchor.order, head.order),
            Math.max(anchor.order, head.order) + 1,
        )
        .map((block) => block.id);
    const first = index.blockById(ids[0])!;
    const last = index.blockById(ids.at(-1)!)!;
    return {
        effects: v3SelectBlocks.of({
            anchorId: anchor.id,
            headId: head.id,
            ids,
        }),
        selection: EditorSelection.single(first.bodyFrom, last.bodyTo),
        userEvent: 'select.v3.blocks',
    };
}

export const v3SelectAllStage = StateEffect.define<{
    blockId: string;
    from: number;
    to: number;
} | null>();
export const v3SelectAllField = StateField.define<{
    blockId: string;
    from: number;
    to: number;
} | null>({
    create: () => null,
    update(previous, transaction) {
        for (const effect of transaction.effects)
            if (effect.is(v3SelectAllStage)) return effect.value;
        return transaction.docChanged || transaction.selection
            ? null
            : previous;
    },
});

export function v3SelectAllTransaction(
    state: EditorState,
): TransactionSpec | null {
    const index = state.field(v3StructureField).current;
    const selection = state.selection.main;
    const previous = state.field(v3SelectAllField);
    if (
        previous &&
        selection.from === previous.from &&
        selection.to === previous.to
    ) {
        const roots = index.blocksIn(null);
        return {
            selection: EditorSelection.single(0, state.doc.length),
            effects: [
                v3SelectAllStage.of(null),
                v3SelectBlocks.of(
                    roots.length
                        ? {
                              anchorId: roots[0].id,
                              headId: roots.at(-1)!.id,
                              ids: roots.map((block) => block.id),
                          }
                        : null,
                ),
            ],
            userEvent: 'select.v3.document',
        };
    }
    const block = index.blockAt(selection.head);
    if (!block) return null;
    let from = block.bodyFrom;
    let to = block.bodyTo;
    try {
        const text = readV3EditableText(state, index, block);
        from = text.from + v3TextPrefixLength(block.type, text.model.content);
        to = text.model.contentFrom + text.model.content.length;
    } catch (error) {
        if (
            !(error instanceof V3OperationError) ||
            error.code !== 'opaque-body'
        )
            throw error;
    }
    return {
        selection: EditorSelection.single(from, to),
        effects: [
            v3SelectAllStage.of({ blockId: block.id, from, to }),
            v3SelectBlocks.of(null),
        ],
        userEvent: 'select.v3.content',
    };
}
