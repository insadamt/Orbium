// Summary: Verifies ID lifecycle, scopes, column headers and untouched source after preparing a command; depends on before/after V3 indexes and declared operation effects, refusing filtered or corrupt partial edits.
import type { EditorState } from '@codemirror/state';
import type { V3DocumentIndex } from '../structure/v3-document-index';
import {
    V3OperationError,
    type V3OperationContext,
    type V3OperationDraft,
} from './v3-transaction-types';

function rejectV3Integrity(message: string): never {
    throw new V3OperationError('integrity-check-failed', message);
}

export function assertV3OperationIntegrity(
    context: V3OperationContext,
    draft: V3OperationDraft,
    nextState: Pick<EditorState, 'sliceDoc'>,
    next: V3DocumentIndex,
) {
    if (!next.valid) {
        const diagnostic = next.structure.diagnostics[0];
        throw new V3OperationError(
            diagnostic.code,
            `${diagnostic.message} (source line ${diagnostic.line})`,
        );
    }
    const expectedBlocks = new Set(
        context.index.structure.blocks.map((block) => block.id),
    );
    for (const id of draft.removedBlocks) expectedBlocks.delete(id);
    for (const id of draft.createdBlocks.keys()) {
        if (expectedBlocks.has(id) || context.index.columnById(id))
            rejectV3Integrity('A new block ID collides with existing content.');
        expectedBlocks.add(id);
    }
    if (
        next.structure.blocks.length !== expectedBlocks.size ||
        next.structure.blocks.some((block) => !expectedBlocks.has(block.id))
    )
        rejectV3Integrity(
            'The operation introduced or removed an undeclared block identity.',
        );
    for (const block of next.structure.blocks) {
        const previous = context.index.blockById(block.id);
        const expected =
            draft.createdBlocks.get(block.id) ??
            (previous && {
                type: draft.convertedTypes.get(block.id) ?? previous.type,
                parentId: draft.changedParents.has(block.id)
                    ? draft.changedParents.get(block.id)!
                    : previous.parentId,
            });
        if (
            !expected ||
            block.type !== expected.type ||
            block.parentId !== expected.parentId
        )
            rejectV3Integrity(
                'The operation changed an unrelated explicit type or owning scope.',
            );
        if (previous && !draft.affectedIds.has(block.id)) {
            const before = context.state.sliceDoc(previous.from, previous.to);
            const after = nextState.sliceDoc(block.from, block.to);
            if (
                before !== after &&
                !(
                    draft.newlinePaddingIds.has(block.id) &&
                    after === `${before}\n`
                )
            )
                rejectV3Integrity(
                    `Unrelated block ${block.id} would be rewritten.`,
                );
        }
    }
    const expectedColumns = new Set(
        context.index.structure.columns.map((column) => column.id),
    );
    for (const id of draft.removedColumns) expectedColumns.delete(id);
    for (const id of draft.createdColumns.keys()) expectedColumns.add(id);
    if (
        next.structure.columns.length !== expectedColumns.size ||
        next.structure.columns.some((column) => !expectedColumns.has(column.id))
    )
        rejectV3Integrity(
            'The operation changed an undeclared column identity.',
        );
    for (const column of next.structure.columns) {
        const previous = context.index.columnById(column.id);
        const expectedLayout =
            draft.createdColumns.get(column.id) ?? previous?.layoutId;
        if (column.layoutId !== expectedLayout)
            rejectV3Integrity('The operation changed a column owner.');
        if (
            previous &&
            (draft.changedColumnHeaders.get(column.id) ??
                context.state.sliceDoc(previous.from, previous.headerTo)) !==
                nextState.sliceDoc(column.from, column.headerTo)
        )
            rejectV3Integrity('An existing column header would be rewritten.');
    }
}
