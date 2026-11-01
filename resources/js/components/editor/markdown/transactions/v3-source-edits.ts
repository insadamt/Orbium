// Summary: Resolves exact source insertion/removal boundaries without consuming neighboring content; depends on the V3 scoped index and owner Text, never Lezer block inference.
import { encodeV3Header, type V3Header } from '../structure/v3-contract';
import type { V3Block } from '../structure/v3-structure-types';
import {
    requireV3Block,
    V3OperationError,
    type V3InsertionTarget,
    type V3OperationContext,
    type V3OperationDraft,
} from './v3-transaction-types';

export function completeV3BlockSource(header: V3Header, body: string) {
    //
    // A new empty paragraph needs its own line even when another identity immediately follows it.
    //
    return `${encodeV3Header(header)}\n${header.type === 'paragraph' && body === '' ? '\n' : body}`;
}

export function consecutiveV3Blocks(
    context: V3OperationContext,
    ids: readonly string[],
) {
    if (!ids.length || new Set(ids).size !== ids.length)
        throw new V3OperationError(
            'invalid-range',
            'Choose a nonempty consecutive range of distinct blocks.',
        );
    const blocks = ids.map((id) => requireV3Block(context, id));
    const first = blocks[0];
    if (
        blocks.some(
            (block, offset) =>
                block.parentId !== first.parentId ||
                block.order !== first.order + offset,
        )
    )
        throw new V3OperationError(
            'invalid-range',
            'Blocks must be consecutive siblings in document order.',
        );
    return blocks;
}

export function v3InsertionPosition(
    context: V3OperationContext,
    target: V3InsertionTarget,
) {
    if (target.parentId !== null && !context.index.columnById(target.parentId))
        throw new V3OperationError(
            'missing-parent',
            'The destination column is unavailable in this owner.',
        );
    if (target.beforeId !== undefined) {
        const before = requireV3Block(context, target.beforeId);
        if (before.parentId !== target.parentId)
            throw new V3OperationError(
                'wrong-parent',
                'The insertion target does not belong to this scope.',
            );
        return before.from;
    }
    return target.parentId === null
        ? context.state.doc.length
        : context.index.columnById(target.parentId)!.bodyTo;
}

export function appendV3Insertion(
    context: V3OperationContext,
    draft: V3OperationDraft,
    position: number,
    source: string,
) {
    const needsPrefix =
        position > 0 && context.state.sliceDoc(position - 1, position) !== '\n';
    const prefix = needsPrefix ? '\n' : '';
    if (needsPrefix) {
        const previous = context.index.blockAt(position - 1);
        if (previous) draft.newlinePaddingIds.add(previous.id);
    }
    const suffix = source.endsWith('\n') ? '' : '\n';
    draft.changes.push({
        from: position,
        insert: `${prefix}${source}${suffix}`,
    });
}

export function markV3Affected(
    context: V3OperationContext,
    draft: V3OperationDraft,
    blocks: readonly V3Block[],
) {
    for (const block of blocks) {
        draft.affectedIds.add(block.id);
        if (block.parentId !== null) {
            const column = context.index.columnById(block.parentId)!;
            draft.affectedIds.add(column.layoutId);
        }
    }
}

export function assertV3ColumnRemainsPopulated(
    context: V3OperationContext,
    blocks: readonly V3Block[],
) {
    const parentId = blocks[0].parentId;
    if (
        parentId !== null &&
        context.index.blocksIn(parentId).length === blocks.length
    )
        throw new V3OperationError(
            'column-cleanup-required',
            'Removing the final child requires the stage-5 column cleanup transaction. No source was changed.',
        );
}

export function sourceV3Range(blocks: readonly V3Block[]) {
    return { from: blocks[0].from, to: blocks[blocks.length - 1].to };
}

export function removalV3Range(
    context: V3OperationContext,
    blocks: readonly V3Block[],
) {
    const range = sourceV3Range(blocks);
    const last = blocks[blocks.length - 1];
    if (last.type === 'columns' && last.parentId === null) {
        const next = context.index.blocksIn(null)[last.order + 1];
        const end = next?.from ?? context.state.doc.length;
        if (/[^ \t\n]/.test(context.state.sliceDoc(range.to, end)))
            throw new V3OperationError(
                'invalid-layout-gap',
                'Unexpected content follows the layout close.',
            );
        //
        // Layout separators have no block owner; remove them with the layout so the previous paragraph cannot acquire extra content.
        //
        range.to = end;
    }
    return range;
}

export function focusV3AfterRemoval(
    context: V3OperationContext,
    blocks: readonly V3Block[],
) {
    const first = blocks[0];
    const siblings = context.index.blocksIn(first.parentId);
    const previous = siblings[first.order - 1];
    const next = siblings[first.order + blocks.length];
    return previous
        ? { blockId: previous.id, bodyOffset: 'end' as const }
        : next
          ? { blockId: next.id, bodyOffset: 0 }
          : null;
}
