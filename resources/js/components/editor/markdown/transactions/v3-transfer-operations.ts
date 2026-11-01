// Summary: Plans an identified cross-document insertion without regenerating moved identities; depends on strict incoming structure, collision checks and owner insertion ranges.
import { V3DocumentIndex } from '../structure/v3-document-index';
import { parseV3Structure } from '../structure/v3-structure-parser';
import { appendV3Insertion, v3InsertionPosition } from './v3-source-edits';
import {
    createV3OperationDraft,
    V3OperationError,
    type V3BlockOperation,
    type V3OperationContext,
} from './v3-transaction-types';

export function planV3TransferInsertion(
    context: V3OperationContext,
    operation: V3BlockOperation,
) {
    if (operation.kind !== 'insert-source') return null;
    const incoming = new V3DocumentIndex(parseV3Structure(operation.source));
    if (!incoming.valid || !incoming.structure.blocks.length)
        throw new V3OperationError(
            'invalid-transfer',
            'The transferred source must contain complete V3 blocks.',
        );
    const roots = incoming.blocksIn(null);
    if (
        operation.target.parentId !== null &&
        roots.some((block) => block.type === 'columns')
    )
        throw new V3OperationError(
            'nested-transfer',
            'A layout cannot become a column child.',
        );
    const draft = createV3OperationDraft();
    for (const block of incoming.structure.blocks) {
        if (
            context.index.blockById(block.id) ||
            context.index.columnById(block.id)
        )
            throw new V3OperationError(
                'transfer-id-collision',
                'The destination already contains a transferred identity.',
            );
        draft.createdBlocks.set(block.id, {
            type: block.type,
            parentId:
                block.parentId === null
                    ? operation.target.parentId
                    : block.parentId,
        });
    }
    for (const column of incoming.structure.columns) {
        if (
            context.index.blockById(column.id) ||
            context.index.columnById(column.id)
        )
            throw new V3OperationError(
                'transfer-id-collision',
                'The destination already contains a transferred identity.',
            );
        draft.createdColumns.set(column.id, column.layoutId);
    }
    appendV3Insertion(
        context,
        draft,
        v3InsertionPosition(context, operation.target),
        operation.source,
    );
    if (operation.target.parentId !== null)
        draft.affectedIds.add(
            context.index.columnById(operation.target.parentId)!.layoutId,
        );
    draft.afterIds = roots.map((block) => block.id);
    draft.focus = {
        blockId:
            incoming.structure.blocks.find((block) => block.type !== 'columns')
                ?.id ?? roots[0].id,
        bodyOffset: 0,
    };
    return draft;
}
