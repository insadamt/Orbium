// Summary: Moves collapsed Live Preview carets off hidden identity headers without changing source or text selections; depends on the validated V3 index and presentation-aware body reader.
import {
    EditorSelection,
    type EditorState,
    type SelectionRange,
} from '@codemirror/state';
import type { V3DocumentIndex } from '../structure/v3-document-index';
import { v3StructureField } from '../structure/v3-structure-state';
import type { V3Block } from '../structure/v3-structure-types';
import { V3OperationError } from '../transactions/v3-transaction-types';
import { readV3EditableText } from './v3-editable-text';
import { v3TextPrefixLength } from './v3-text-prefix';

export function v3BodyCaretPosition(
    state: EditorState,
    index: V3DocumentIndex,
    block: V3Block,
    atEnd = false,
) {
    try {
        const text = readV3EditableText(state, index, block);
        if (!atEnd)
            return (
                text.from + v3TextPrefixLength(block.type, text.model.content)
            );
        //
        // The final newline separates this body from the next identity header; preceding blank lines remain real editable content.
        //
        return text.model.metadata ? text.to : Math.max(text.from, text.to - 1);
    } catch (error) {
        if (
            !(error instanceof V3OperationError) ||
            error.code !== 'opaque-body'
        )
            throw error;
        //
        // Rich widgets own focus at their body start; never move a caret into their hidden closing fences.
        //
        return block.bodyFrom;
    }
}

export function normalizeV3HeaderSelection(
    state: EditorState,
    range: SelectionRange,
    previousHead = range.head,
): SelectionRange {
    if (!range.empty) return range;
    const index = state.field(v3StructureField).current;
    const block = index.blockAt(range.head);
    if (block?.type === 'spacer') {
        const siblings = index.blocksIn(block.parentId);
        const forward = previousHead <= range.head;
        const ordered = forward
            ? siblings.slice(block.order + 1)
            : siblings.slice(0, block.order).reverse();
        const neighbor = ordered.find((item) => item.type !== 'spacer');
        return neighbor
            ? EditorSelection.cursor(
                  v3BodyCaretPosition(state, index, neighbor, !forward),
              )
            : EditorSelection.range(block.from, block.to);
    }
    if (block?.type === 'columns' && range.head < block.bodyTo) {
        const firstColumn = index.structure.columns.find(
            (column) => column.layoutId === block.id,
        );
        const child = firstColumn && index.blocksIn(firstColumn.id)[0];
        return child
            ? EditorSelection.cursor(
                  v3BodyCaretPosition(state, index, child),
                  1,
              )
            : range;
    }
    if (!block || range.head >= block.bodyFrom) return range;
    //
    // Atomic ranges allow their starting edge, but inserting there would edit the next block's identity. Backward navigation belongs at the previous body's end.
    //
    const previous =
        previousHead > range.head
            ? index
                  .blocksIn(block.parentId)
                  .slice(0, block.order)
                  .reverse()
                  .find((item) => item.type !== 'spacer')
            : null;
    const target =
        previous &&
        previous.type !== 'columns' &&
        previous.bodyFrom < previous.bodyTo
            ? previous
            : block;
    const atEnd = target !== block;
    return EditorSelection.cursor(
        v3BodyCaretPosition(state, index, target, atEnd),
        atEnd ? -1 : 1,
    );
}
