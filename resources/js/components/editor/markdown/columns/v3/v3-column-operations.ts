// Summary: Plans V3 layout creation, side drops, resizing, stacking and transfers as precise owner changes; depends on scoped identity, exact child source bytes and the column consequence finalizer.
import { equalColumnWidths } from '../column-source';
import {
    appendV3Insertion,
    completeV3BlockSource,
    consecutiveV3Blocks,
    removalV3Range,
    sourceV3Range,
    v3InsertionPosition,
} from '../../transactions/v3-source-edits';
import {
    createV3OperationDraft,
    requireV3Block,
    V3OperationError,
    type V3OperationContext,
    type V3OperationDraft,
    type V3BlockOperation,
} from '../../transactions/v3-transaction-types';
import {
    readV3ColumnModel,
    requireV3Widths,
    serializeV3Columns,
    type V3ColumnModel,
    v3DirectiveFenceSpan,
} from './v3-column-model';

export function replaceV3LayoutHeader(
    context: V3OperationContext,
    draft: V3OperationDraft,
    model: V3ColumnModel,
    widths: readonly number[],
    fence = model.directive.fence,
) {
    draft.changes.push({
        from: model.directive.from,
        to: model.directive.headerTo,
        insert: `${':'.repeat(fence)}orbium ${JSON.stringify({ ...model.directive.metadata, widths })}`,
    });
    if (fence !== model.directive.fence)
        draft.changes.push({
            ...v3DirectiveFenceSpan(context.state.doc, model.directive.bodyTo),
            insert: ':'.repeat(fence),
        });
    draft.affectedIds.add(model.block.id);
}

function requireV3OrdinaryBlocks(
    context: V3OperationContext,
    ids: readonly string[],
) {
    const blocks = consecutiveV3Blocks(context, ids);
    if (blocks.some((block) => block.type === 'columns'))
        throw new V3OperationError(
            'nested-columns',
            'Move a whole layout in the root flow; it cannot become a column child.',
        );
    return blocks;
}

function sourceV3TransferredBlocks(
    context: V3OperationContext,
    draft: V3OperationDraft,
    ids: readonly string[],
) {
    const blocks = requireV3OrdinaryBlocks(context, ids);
    const range = sourceV3Range(blocks);
    let source = context.state.sliceDoc(range.from, range.to);
    if (!source.endsWith('\n')) {
        source += '\n';
        draft.newlinePaddingIds.add(blocks.at(-1)!.id);
    }
    if (blocks[0].parentId !== null)
        draft.affectedIds.add(
            context.index.columnById(blocks[0].parentId)!.layoutId,
        );
    return { blocks, range, source };
}

function createV3EmptyChild(
    context: V3OperationContext,
    draft: V3OperationDraft,
    columnId: string,
) {
    const id = context.allocateIdentity();
    draft.createdBlocks.set(id, { type: 'paragraph', parentId: columnId });
    return {
        id,
        source: completeV3BlockSource({ id, type: 'paragraph' }, '\n'),
    };
}

function planV3CreateColumns(
    context: V3OperationContext,
    operation: Extract<V3BlockOperation, { kind: 'create-columns' }>,
) {
    if (operation.target.parentId !== null || ![2, 3].includes(operation.count))
        throw new V3OperationError(
            'invalid-layout-target',
            'Create two or three columns in the root document flow.',
        );
    const position = v3InsertionPosition(context, operation.target);
    const draft = createV3OperationDraft();
    const id = context.allocateIdentity();
    const columns = Array.from({ length: operation.count }, () => {
        const columnId = context.allocateIdentity();
        draft.createdColumns.set(columnId, id);
        const child = createV3EmptyChild(context, draft, columnId);
        return { id: columnId, source: child.source, childId: child.id };
    });
    draft.createdBlocks.set(id, { type: 'columns', parentId: null });
    appendV3Insertion(
        context,
        draft,
        position,
        serializeV3Columns({
            id,
            columns,
            widths: equalColumnWidths(operation.count),
        }),
    );
    if (operation.replaceBlockId) {
        const replaced = requireV3Block(context, operation.replaceBlockId);
        if (
            replaced.parentId !== null ||
            replaced.type !== 'paragraph' ||
            replaced.from !== position
        )
            throw new V3OperationError(
                'invalid-layout-replacement',
                'Replace a root paragraph at the insertion position.',
            );
        draft.changes.push({
            from: replaced.from,
            to: replaced.to,
            insert: '',
        });
        draft.removedBlocks.add(replaced.id);
        draft.affectedIds.add(replaced.id);
    }
    draft.focus = { blockId: columns[0].childId, bodyOffset: 0 };
    draft.afterIds = [id];
    return draft;
}

function planV3WrapColumns(
    context: V3OperationContext,
    operation: Extract<V3BlockOperation, { kind: 'wrap-columns' }>,
) {
    const draft = createV3OperationDraft();
    const moved = sourceV3TransferredBlocks(context, draft, operation.blockIds);
    const beside = requireV3Block(context, operation.besideId);
    if (
        beside.parentId !== null ||
        beside.type === 'columns' ||
        moved.blocks.some((block) => block.id === beside.id) ||
        !['left', 'right'].includes(operation.side)
    )
        throw new V3OperationError(
            'invalid-side-drop',
            'Drop beside a distinct ordinary root block to create a layout.',
        );
    const id = context.allocateIdentity();
    const movingColumnId = context.allocateIdentity();
    const targetColumnId = context.allocateIdentity();
    draft.createdBlocks.set(id, { type: 'columns', parentId: null });
    draft.createdColumns.set(movingColumnId, id);
    draft.createdColumns.set(targetColumnId, id);
    for (const block of moved.blocks)
        draft.changedParents.set(block.id, movingColumnId);
    draft.changedParents.set(beside.id, targetColumnId);
    let targetSource = context.state.sliceDoc(beside.from, beside.to);
    if (!targetSource.endsWith('\n')) {
        targetSource += '\n';
        draft.newlinePaddingIds.add(beside.id);
    }
    const columns = [
        { id: movingColumnId, source: moved.source },
        { id: targetColumnId, source: targetSource },
    ];
    if (operation.side === 'right') columns.reverse();
    draft.changes.push(
        { ...moved.range, insert: '' },
        {
            from: beside.from,
            to: beside.to,
            insert: serializeV3Columns({
                id,
                columns,
                widths: equalColumnWidths(2),
            }),
        },
    );
    draft.before = draft.movedRange = moved.range;
    draft.afterIds = moved.blocks.map((block) => block.id);
    draft.focus = { blockId: moved.blocks[0].id, bodyOffset: 0 };
    return draft;
}

function planV3AddColumn(
    context: V3OperationContext,
    operation: Extract<V3BlockOperation, { kind: 'add-column' }>,
) {
    const model = readV3ColumnModel(context.index, operation.layoutId);
    if (
        model.columns.length !== 2 ||
        (operation.side !== undefined &&
            !['left', 'right'].includes(operation.side))
    )
        throw new V3OperationError(
            'column-limit',
            'A layout can add a third column only.',
        );
    const draft = createV3OperationDraft();
    const id = context.allocateIdentity();
    draft.createdColumns.set(id, model.block.id);
    let source: string;
    let focusId: string;
    if (operation.blockIds) {
        const moved = sourceV3TransferredBlocks(
            context,
            draft,
            operation.blockIds,
        );
        draft.changes.push({ ...moved.range, insert: '' });
        for (const block of moved.blocks)
            draft.changedParents.set(block.id, id);
        draft.before = draft.movedRange = moved.range;
        source = moved.source;
        focusId = moved.blocks[0].id;
        draft.afterIds = moved.blocks.map((block) => block.id);
    } else {
        const child = createV3EmptyChild(context, draft, id);
        source = child.source;
        focusId = child.id;
        draft.before = { from: model.block.from, to: model.block.to };
        draft.afterIds = [model.block.id];
    }
    let fenceLength = 4;
    for (const line of source.split('\n'))
        fenceLength = Math.max(
            fenceLength,
            (/^\s*(:{3,})/.exec(line)?.[1].length ?? 0) + 1,
        );
    const fence = ':'.repeat(fenceLength);
    const widths = equalColumnWidths(3);
    const insertBefore =
        operation.side === 'left'
            ? model.columns[0].from
            : model.directive.bodyTo;
    const inserted = `${fence}orbium ${JSON.stringify({ kind: 'column', id })}\n${source}${fence}\n\n`;
    draft.changes.push({ from: insertBefore, insert: inserted });
    replaceV3LayoutHeader(
        context,
        draft,
        model,
        widths,
        Math.max(model.directive.fence, fenceLength + 1),
    );
    draft.focus = { blockId: focusId, bodyOffset: 0 };
    return draft;
}

function planV3CrossScopeMove(
    context: V3OperationContext,
    operation: Extract<V3BlockOperation, { kind: 'move' }>,
) {
    const draft = createV3OperationDraft();
    const moved = sourceV3TransferredBlocks(context, draft, operation.blockIds);
    const position = v3InsertionPosition(context, operation.target);
    if (position >= moved.range.from && position <= moved.range.to)
        throw new V3OperationError(
            'invalid-move',
            'The destination cannot be inside the moving range.',
        );
    draft.changes.push({ ...moved.range, insert: '' });
    appendV3Insertion(context, draft, position, moved.source);
    for (const block of moved.blocks)
        draft.changedParents.set(block.id, operation.target.parentId);
    if (operation.target.parentId !== null)
        draft.affectedIds.add(
            context.index.columnById(operation.target.parentId)!.layoutId,
        );
    draft.before = draft.movedRange = moved.range;
    draft.afterIds = moved.blocks.map((block) => block.id);
    draft.focus = { blockId: moved.blocks[0].id, bodyOffset: 0 };
    return draft;
}

export function planV3ColumnOperation(
    context: V3OperationContext,
    operation: V3BlockOperation,
): V3OperationDraft | null {
    switch (operation.kind) {
        case 'create-columns':
            return planV3CreateColumns(context, operation);
        case 'wrap-columns':
            return planV3WrapColumns(context, operation);
        case 'add-column':
            return planV3AddColumn(context, operation);
        case 'resize-columns': {
            const model = readV3ColumnModel(context.index, operation.layoutId);
            requireV3Widths(operation.widths, model.columns.length);
            const draft = createV3OperationDraft();
            replaceV3LayoutHeader(context, draft, model, operation.widths);
            draft.before = { from: model.block.from, to: model.block.to };
            draft.afterIds = [model.block.id];
            draft.focus = {
                blockId:
                    context.index.blocksIn(model.columns[0].id)[0]?.id ??
                    model.block.id,
                bodyOffset: 0,
            };
            return draft;
        }
        case 'stack-columns': {
            const model = readV3ColumnModel(context.index, operation.layoutId);
            const draft = createV3OperationDraft();
            const children = model.columns.flatMap((column) =>
                context.index.blocksIn(column.id),
            );
            draft.changes.push({
                ...removalV3Range(context, [model.block]),
                insert: children
                    .map((block) =>
                        context.state.sliceDoc(block.from, block.to),
                    )
                    .join(''),
            });
            draft.removedBlocks.add(model.block.id);
            for (const column of model.columns)
                draft.removedColumns.add(column.id);
            for (const block of children)
                draft.changedParents.set(block.id, null);
            draft.before = { from: model.block.from, to: model.block.to };
            draft.afterIds = children.map((block) => block.id);
            draft.focus = children.length
                ? { blockId: children[0].id, bodyOffset: 0 }
                : null;
            return draft;
        }
        case 'move': {
            const blocks = consecutiveV3Blocks(context, operation.blockIds);
            return blocks[0].parentId !== operation.target.parentId
                ? planV3CrossScopeMove(context, operation)
                : null;
        }
        case 'delete': {
            const blocks = consecutiveV3Blocks(context, operation.blockIds);
            const parentId = blocks[0].parentId;
            if (
                parentId === null ||
                context.index.blocksIn(parentId).length !== blocks.length
            )
                return null;
            const draft = createV3OperationDraft();
            draft.changes.push({ ...sourceV3Range(blocks), insert: '' });
            for (const block of blocks) draft.removedBlocks.add(block.id);
            draft.affectedIds.add(context.index.columnById(parentId)!.layoutId);
            draft.before = sourceV3Range(blocks);
            return draft;
        }
        default:
            return null;
    }
}
