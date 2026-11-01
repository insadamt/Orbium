// Summary: Raises only necessary container fences and removes emptied columns atomically with their triggering edit; depends on composed CodeMirror changes, scoped V3 parsing and declared identity/scope consequences.
import { ChangeSet, type ChangeSpec, type Text } from '@codemirror/state';
import { V3DocumentIndex } from '../../structure/v3-document-index';
import { parseV3Structure } from '../../structure/v3-structure-parser';
import { completeV3BlockSource } from '../../transactions/v3-source-edits';
import { mapV3OrdinaryBodyChanges } from '../../structure/v3-structure-state';
import {
    V3OperationError,
    type V3BlockOperation,
    type V3OperationContext,
    type V3OperationDraft,
} from '../../transactions/v3-transaction-types';
import { readV3ColumnModel, v3DirectiveFenceSpan } from './v3-column-model';

function requireV3Candidate(source: Text) {
    const index = new V3DocumentIndex(parseV3Structure(source));
    if (!index.valid) {
        const issue = index.structure.diagnostics[0];
        throw new V3OperationError(issue.code, issue.message);
    }
    return index;
}

function declareV3Parent(
    draft: V3OperationDraft,
    id: string,
    parentId: string | null,
) {
    const created = draft.createdBlocks.get(id);
    if (created) created.parentId = parentId;
    else draft.changedParents.set(id, parentId);
}

function retireV3Identity(
    draft: V3OperationDraft,
    id: string,
    kind: 'block' | 'column',
) {
    const created =
        kind === 'block' ? draft.createdBlocks : draft.createdColumns;
    if (!created.delete(id))
        (kind === 'block' ? draft.removedBlocks : draft.removedColumns).add(id);
    for (const [original, copied] of draft.copiedIds)
        if (copied === id) draft.copiedIds.delete(original);
}

function prepareV3FenceChanges(
    context: V3OperationContext,
    draft: V3OperationDraft,
    changes: ChangeSet,
    source: Text,
) {
    const edits: ChangeSpec[] = [];
    for (const original of context.index.structure.blocks) {
        if (
            original.type !== 'columns' ||
            draft.removedBlocks.has(original.id) ||
            (draft.movedRange &&
                original.from >= draft.movedRange.from &&
                original.to <= draft.movedRange.to) ||
            !draft.affectedIds.has(original.id)
        )
            continue;
        const model = readV3ColumnModel(context.index, original.id);
        let outerFence = model.directive.fence;
        for (const column of model.columns) {
            if (draft.removedColumns.has(column.id)) continue;
            const from = changes.mapPos(column.bodyFrom, -1);
            const to = changes.mapPos(column.bodyTo, 1);
            const childIndex = requireV3Candidate(source.slice(from, to));
            if (
                childIndex.structure.blocks.some(
                    (block) => block.type === 'columns',
                )
            )
                throw new V3OperationError(
                    'nested-columns',
                    'A column cannot contain another layout.',
                );
            const directive = context.index.structure.directives.find(
                (entry) => entry.from === column.from,
            )!;
            const maximumInnerFence = childIndex.structure.directives.reduce(
                (maximum, entry) => Math.max(maximum, entry.fence),
                0,
            );
            const fence = Math.max(directive.fence, maximumInnerFence + 1);
            outerFence = Math.max(outerFence, fence + 1);
            if (fence === directive.fence) continue;
            const headerFrom = changes.mapPos(column.from, 1);
            const headerTo = source.lineAt(headerFrom).to;
            const header = `${':'.repeat(fence)}orbium ${JSON.stringify(directive.metadata)}`;
            edits.push(
                { from: headerFrom, to: headerTo, insert: header },
                {
                    ...v3DirectiveFenceSpan(source, to),
                    insert: ':'.repeat(fence),
                },
            );
            draft.changedColumnHeaders.set(column.id, header);
        }
        const outerFrom = changes.mapPos(model.directive.from, -1);
        const outerSpan = v3DirectiveFenceSpan(source, outerFrom);
        const currentFence = outerSpan.to - outerSpan.from;
        if (!currentFence)
            throw new V3OperationError(
                'missing-layout-fence',
                'The layout header was unexpectedly replaced.',
            );
        outerFence = Math.max(outerFence, currentFence);
        if (outerFence > currentFence) {
            edits.push({
                ...outerSpan,
                insert: ':'.repeat(outerFence),
            });
            const close = changes.mapPos(model.directive.bodyTo, 1);
            edits.push({
                ...v3DirectiveFenceSpan(source, close),
                insert: ':'.repeat(outerFence),
            });
        }
    }
    return edits;
}

export function completeV3ColumnConsequences(
    context: V3OperationContext,
    draft: V3OperationDraft,
    operation: V3BlockOperation,
) {
    const affectedLayouts = new Set(
        [...draft.affectedIds].filter(
            (id) => context.index.blockById(id)?.type === 'columns',
        ),
    );
    for (const [id, created] of draft.createdBlocks)
        if (created.type === 'columns') affectedLayouts.add(id);
    if (!affectedLayouts.size) return null;
    let changes = context.state.changes(draft.changes);
    let source = changes.apply(context.state.doc);
    const mapped = mapV3OrdinaryBodyChanges(context.index, {
        before: context.state.doc,
        after: source,
        changes,
    });
    if (mapped) return { structure: mapped, mappedBody: true };
    const fences = prepareV3FenceChanges(context, draft, changes, source);
    if (fences.length) {
        const next = ChangeSet.of(fences, source.length);
        changes = changes.compose(next);
        source = next.apply(source);
    }
    const intermediate = requireV3Candidate(source);
    const cleanup: ChangeSpec[] = [];
    const focusCandidates: string[] = [];
    for (const block of intermediate.structure.blocks) {
        if (block.type !== 'columns' || !affectedLayouts.has(block.id))
            continue;
        const model = readV3ColumnModel(intermediate, block.id);
        const surviving = model.columns.filter(
            (column) => intermediate.blocksIn(column.id).length > 0,
        );
        if (surviving.length === model.columns.length) continue;
        const emptied = model.columns.filter(
            (column) => !intermediate.blocksIn(column.id).length,
        );
        for (const column of emptied)
            retireV3Identity(draft, column.id, 'column');
        if (surviving.length <= 1) {
            const children = surviving.flatMap((column) =>
                intermediate.blocksIn(column.id),
            );
            //
            // The candidate's coordinates differ from the original owner; read candidate separators explicitly before replacing the layout.
            //
            const nextRoot = intermediate.blocksIn(null)[block.order + 1];
            const to = nextRoot?.from ?? source.length;
            if (/[^ \t\n]/.test(source.sliceString(block.to, to)))
                throw new V3OperationError(
                    'invalid-layout-gap',
                    'Unexpected content follows the layout.',
                );
            cleanup.push({
                from: block.from,
                to,
                insert: children
                    .map((child) => source.sliceString(child.from, child.to))
                    .join(''),
            });
            retireV3Identity(draft, block.id, 'block');
            for (const column of surviving)
                retireV3Identity(draft, column.id, 'column');
            for (const child of children) {
                declareV3Parent(draft, child.id, null);
                focusCandidates.push(child.id);
            }
        } else {
            const remainingWidths = surviving.map(
                (column) => model.widths[column.order],
            );
            const sum = remainingWidths.reduce(
                (total, width) => total + width,
                0,
            );
            const left = Math.round((remainingWidths[0] * 10000) / sum);
            const widths = [left, 10000 - left];
            for (const column of emptied)
                cleanup.push({ from: column.from, to: column.to, insert: '' });
            cleanup.push({
                from: model.directive.from,
                to: model.directive.headerTo,
                insert: `${':'.repeat(model.directive.fence)}orbium ${JSON.stringify({ ...model.directive.metadata, widths })}`,
            });
            const removedOrder = emptied[0].order;
            const nearest =
                surviving[Math.min(removedOrder, surviving.length - 1)];
            focusCandidates.push(
                ...intermediate.blocksIn(nearest.id).map((child) => child.id),
            );
        }
    }
    if (cleanup.length) {
        const next = ChangeSet.of(cleanup, source.length);
        changes = changes.compose(next);
        source = next.apply(source);
    }
    let finalIndex = cleanup.length ? requireV3Candidate(source) : intermediate;
    if (
        operation.kind === 'delete' &&
        operation.ensureParagraph &&
        !finalIndex.structure.blocks.length
    ) {
        const id = context.allocateIdentity();
        const insert = completeV3BlockSource({ id, type: 'paragraph' }, '\n');
        const next = ChangeSet.of({ from: 0, insert }, source.length);
        changes = changes.compose(next);
        source = next.apply(source);
        draft.createdBlocks.set(id, { type: 'paragraph', parentId: null });
        focusCandidates.push(id);
        finalIndex = requireV3Candidate(source);
    }
    if (!draft.focus || !finalIndex.blockById(draft.focus.blockId)) {
        const focused =
            focusCandidates
                .map((id) => finalIndex.blockById(id))
                .find((block) => block !== null) ??
            finalIndex.structure.blocks.find(
                (block) => block.type !== 'columns',
            );
        draft.focus = focused ? { blockId: focused.id, bodyOffset: 0 } : null;
    }
    draft.afterIds = draft.afterIds.filter((id) => finalIndex.blockById(id));
    if (!draft.afterIds.length && draft.focus)
        draft.afterIds = [draft.focus.blockId];
    draft.changes = [changes];
    return { structure: finalIndex.structure, mappedBody: false };
}
