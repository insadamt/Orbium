// Summary: Moves complete identified ranges across open Documents with linked owner undo and prevalidated destination writes; depends on V3 plans, existing linked history and registered product drop targets.
import { undo } from '@codemirror/commands';
import type { EditorView } from '@codemirror/view';
import { v3ColumnProjectionFor } from '../columns/v3/v3-column-registry';
import { v3StructureField } from '../structure/v3-structure-state';
import { v3BlockSelectionField } from '../editing/v3-block-selection';
import { prepareV3Operation } from '../transactions/v3-transaction-plan';
import { applyV3PreparedOperation } from '../transactions/v3-transaction-dispatch';
import { performLinkedMarkdownMove } from '../interactions/markdown-linked-move-history';
import type { MarkdownBlockRange } from '../interactions/markdown-block-actions';
import type { ResolvedSplitBlockTarget } from '../interactions/markdown-split-block-targets';
import { markdownSplitDocumentIdentity } from '../interactions/markdown-split-block-targets';
import { protectV3MoveSave } from './v3-move-persistence';

export function moveV3AcrossDocuments(options: {
    source: EditorView;
    block: MarkdownBlockRange;
    target: ResolvedSplitBlockTarget;
}) {
    const source =
        v3ColumnProjectionFor(options.source)?.owner ?? options.source;
    const target = options.target.endpoint.view;
    if (!options.block.v3Id || !options.target.block.v3Id || source === target)
        return false;
    const index = source.state.field(v3StructureField).current;
    const block = index.blockById(options.block.v3Id)!;
    const selected = options.source.state.field(
        v3BlockSelectionField,
        false,
    )?.ids;
    const ids = selected?.includes(block.id) ? selected : [block.id];
    const sourceDocument = markdownSplitDocumentIdentity(source);
    const targetDocument = markdownSplitDocumentIdentity(target);
    let persistenceMoveId = '';
    const blocks = ids.map((id) => index.blockById(id)!);
    const first = blocks[0];
    const last = blocks.at(-1)!;
    const payload = source.state.sliceDoc(first.from, last.to);
    const targetIndex = target.state.field(v3StructureField).current;
    const neighbor = targetIndex.blockById(options.target.block.v3Id)!;
    const beforeId =
        options.target.placement === 'before'
            ? neighbor.id
            : targetIndex.neighbor(neighbor.id, 1)?.id;
    const available = (view: EditorView) =>
        view.dom.isConnected && !view.dom.closest('[hidden], [inert]');
    performLinkedMarkdownMove({
        source,
        target,
        block: {
            ...options.block,
            from: first.from,
            to: last.to,
            source: payload,
        },
        prepareHistoryPersistence(direction) {
            protectV3MoveSave({
                id: persistenceMoveId,
                removing:
                    direction === 'undo' ? targetDocument : sourceDocument,
                receiving:
                    direction === 'undo' ? sourceDocument : targetDocument,
                blockIds: ids,
                expectedBodies: new Map(),
            });
        },
        perform(id) {
            persistenceMoveId = id;
            const remove = prepareV3Operation({
                owner: source,
                state: source.state,
                operation: {
                    kind: 'delete',
                    blockIds: ids,
                    ensureParagraph: true,
                },
                linkedMoveId: id,
            });
            const insert = prepareV3Operation({
                owner: target,
                state: target.state,
                operation: {
                    kind: 'insert-source',
                    source: payload,
                    target: { parentId: neighbor.parentId, beforeId },
                },
                linkedMoveId: id,
            });
            const cancelSaveBarrier = protectV3MoveSave({
                id,
                removing: sourceDocument,
                receiving: targetDocument,
                blockIds: ids,
                expectedBodies: new Map(),
            });
            try {
                applyV3PreparedOperation({
                    view: target,
                    prepared: insert,
                    isAvailable: () => available(target),
                    focusEditor: false,
                });
                applyV3PreparedOperation({
                    view: source,
                    prepared: remove,
                    isAvailable: () => available(source),
                    focusEditor: false,
                });
            } catch (error) {
                //
                // Roll back only this exact destination transaction if its paired owner becomes unavailable before acceptance.
                //
                if (target.state === insert.transaction.state) undo(target);
                cancelSaveBarrier();
                throw error;
            }
            return {
                v3Id: first.id,
                from: insert.after!.from,
                to: insert.after!.to,
                name: options.block.name,
                source: payload,
            };
        },
    });
    target.focus();
    return true;
}
