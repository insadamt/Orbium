// Summary: Plans identified insert/delete/duplicate/reorder operations using narrow owner edits; depends on exact V3 source ranges and ID remapping, preserving opaque payloads and references verbatim.
import { ChangeSet, type ChangeSpec } from '@codemirror/state';
import { encodeV3Header } from '../structure/v3-contract';
import type { V3Block } from '../structure/v3-structure-types';
import {
    createV3OperationDraft,
    V3OperationError,
    type V3BlockOperation,
    type V3OperationContext,
    type V3OperationDraft,
} from './v3-transaction-types';
import {
    appendV3Insertion,
    assertV3ColumnRemainsPopulated,
    completeV3BlockSource,
    consecutiveV3Blocks,
    focusV3AfterRemoval,
    markV3Affected,
    removalV3Range,
    sourceV3Range,
    v3InsertionPosition,
} from './v3-source-edits';

function containedV3Identities(
    context: V3OperationContext,
    blocks: readonly V3Block[],
) {
    const range = sourceV3Range(blocks);
    return {
        range,
        blocks: context.index.structure.blocks.filter(
            (block) => block.from >= range.from && block.to <= range.to,
        ),
        columns: context.index.structure.columns.filter(
            (column) => column.from >= range.from && column.to <= range.to,
        ),
    };
}

function planV3Insert(
    context: V3OperationContext,
    operation: Extract<V3BlockOperation, { kind: 'insert' }>,
) {
    if (operation.type === 'columns')
        throw new V3OperationError(
            'column-creation-required',
            'Use the stage-5 layout creation transaction for a new columns container.',
        );
    const draft = createV3OperationDraft();
    const position = v3InsertionPosition(context, operation.target);
    const id = context.allocateIdentity();
    appendV3Insertion(
        context,
        draft,
        position,
        completeV3BlockSource({ id, type: operation.type }, operation.body),
    );
    draft.createdBlocks.set(id, {
        type: operation.type,
        parentId: operation.target.parentId,
    });
    if (operation.target.parentId !== null)
        draft.affectedIds.add(
            context.index.columnById(operation.target.parentId)!.layoutId,
        );
    draft.focus = { blockId: id, bodyOffset: operation.caret ?? 0 };
    draft.afterIds = [id];
    return draft;
}

function planV3Delete(
    context: V3OperationContext,
    ids: readonly string[],
    ensureParagraph = false,
) {
    const blocks = consecutiveV3Blocks(context, ids);
    assertV3ColumnRemainsPopulated(context, blocks);
    const draft = createV3OperationDraft();
    const contained = containedV3Identities(context, blocks);
    draft.changes.push({ ...removalV3Range(context, blocks), insert: '' });
    for (const block of contained.blocks) draft.removedBlocks.add(block.id);
    for (const column of contained.columns) draft.removedColumns.add(column.id);
    markV3Affected(context, draft, blocks);
    draft.focus = focusV3AfterRemoval(context, blocks);
    draft.before = contained.range;
    if (
        ensureParagraph &&
        blocks[0].parentId === null &&
        blocks.length === context.index.blocksIn(null).length
    ) {
        const id = context.allocateIdentity();
        draft.changes = [
            {
                ...removalV3Range(context, blocks),
                insert: completeV3BlockSource({ id, type: 'paragraph' }, '\n'),
            },
        ];
        draft.createdBlocks.set(id, { type: 'paragraph', parentId: null });
        draft.focus = { blockId: id, bodyOffset: 0 };
        draft.afterIds = [id];
    }
    return draft;
}

export function copyV3Range(
    context: V3OperationContext,
    draft: V3OperationDraft,
    blocks: readonly V3Block[],
    targetParentId?: string | null,
) {
    const contained = containedV3Identities(context, blocks);
    for (const block of contained.blocks)
        draft.copiedIds.set(block.id, context.allocateIdentity());
    for (const column of contained.columns)
        draft.copiedIds.set(column.id, context.allocateIdentity());
    const edits: ChangeSpec[] = [];
    const directivesByFrom = new Map(
        context.index.structure.directives.map((entry) => [entry.from, entry]),
    );
    for (const block of contained.blocks) {
        const id = draft.copiedIds.get(block.id)!;
        const parentId =
            block.parentId === null
                ? (targetParentId ?? null)
                : (draft.copiedIds.get(block.parentId) ?? block.parentId);
        edits.push({
            from: block.from - contained.range.from,
            to: block.headerTo - contained.range.from,
            insert: encodeV3Header({ id, type: block.type }),
        });
        draft.createdBlocks.set(id, { type: block.type, parentId });
    }
    for (const column of contained.columns) {
        const id = draft.copiedIds.get(column.id)!;
        const directive = directivesByFrom.get(column.from)!;
        edits.push({
            from: column.from - contained.range.from,
            to: column.headerTo - contained.range.from,
            insert: `${':'.repeat(directive.fence)}orbium ${JSON.stringify({ kind: 'column', id })}`,
        });
        draft.createdColumns.set(id, draft.copiedIds.get(column.layoutId)!);
    }
    const original = context.state.doc.slice(
        contained.range.from,
        contained.range.to,
    );
    //
    // Relative source edits touch only real identity headers; literal examples, attachment IDs and map-topic IDs stay opaque.
    //
    return ChangeSet.of(edits, original.length).apply(original).toString();
}

function planV3Duplicate(context: V3OperationContext, ids: readonly string[]) {
    const blocks = consecutiveV3Blocks(context, ids);
    const draft = createV3OperationDraft();
    const source = copyV3Range(context, draft, blocks);
    appendV3Insertion(context, draft, blocks[blocks.length - 1].to, source);
    for (const block of blocks)
        if (block.parentId !== null)
            draft.affectedIds.add(
                context.index.columnById(block.parentId)!.layoutId,
            );
    const firstId = draft.copiedIds.get(blocks[0].id)!;
    draft.focus = { blockId: firstId, bodyOffset: 0 };
    draft.afterIds = blocks.map((block) => draft.copiedIds.get(block.id)!);
    return draft;
}

function planV3Move(
    context: V3OperationContext,
    operation: Extract<V3BlockOperation, { kind: 'move' }>,
) {
    const blocks = consecutiveV3Blocks(context, operation.blockIds);
    if (operation.target.parentId !== blocks[0].parentId)
        throw new V3OperationError(
            'column-transfer-required',
            'Cross-scope moves require the stage-5 column transfer transaction.',
        );
    const position = v3InsertionPosition(context, operation.target);
    const range = removalV3Range(context, blocks);
    const destinationOrder =
        operation.target.beforeId === undefined
            ? context.index.blocksIn(blocks[0].parentId).length
            : context.index.blockById(operation.target.beforeId)!.order;
    if (
        (position >= range.from && position <= range.to) ||
        (destinationOrder >= blocks[0].order &&
            destinationOrder <= blocks[0].order + blocks.length)
    )
        throw new V3OperationError(
            'unchanged-move',
            'The destination is inside or immediately beside the moved range.',
        );
    const draft = createV3OperationDraft();
    appendV3Insertion(
        context,
        draft,
        position,
        context.state.sliceDoc(range.from, range.to),
    );
    draft.changes.push({ ...range, insert: '' });
    markV3Affected(context, draft, blocks);
    draft.before = draft.movedRange = range;
    draft.afterIds = blocks.map((block) => block.id);
    draft.focus = { blockId: blocks[0].id, bodyOffset: 0 };
    return draft;
}

export function planV3StructureOperation(
    context: V3OperationContext,
    operation: V3BlockOperation,
): V3OperationDraft | null {
    switch (operation.kind) {
        case 'insert':
            return planV3Insert(context, operation);
        case 'delete':
            return planV3Delete(
                context,
                operation.blockIds,
                operation.ensureParagraph,
            );
        case 'duplicate':
            return planV3Duplicate(context, operation.blockIds);
        case 'move':
            return planV3Move(context, operation);
        default:
            return null;
    }
}
