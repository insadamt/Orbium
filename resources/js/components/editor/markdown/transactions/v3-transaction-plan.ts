// Summary: Prepares one validated, isolated owner transaction before any view write; depends on the V3 structural field, operation planners, identity integrity and existing history/motion effects.
import { planV3TransferInsertion } from './v3-transfer-operations';
import { linkedMarkdownMoveEffect } from '../interactions/markdown-linked-move-history';
import { historyField, isolateHistory } from '@codemirror/commands';
import {
    EditorSelection,
    type EditorState,
    type Text,
    Transaction,
} from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { createV3Identity, isV3BlockType } from '../structure/v3-contract';
import {
    mapV3OrdinaryBodyChanges,
    v3StructureField,
} from '../structure/v3-structure-state';
import { V3DocumentIndex } from '../structure/v3-document-index';
import { parseV3Structure } from '../structure/v3-structure-parser';
import {
    markdownBlockHistoryMotion,
    markdownBlockMotionEffect,
} from '../interactions/markdown-block-history-motion';
import { richBlockMove } from '../rich/rich-widget-move';
import { planV3StructureOperation } from './v3-block-structure-operations';
import { planV3TextOperation } from './v3-block-text-operations';
import { assertV3OperationIntegrity } from './v3-transaction-integrity';
import { readV3TextBody } from './v3-text-body';
import { v3TextPrefixLength } from '../editing/v3-text-prefix';
import { isV3BodyTypeValid } from '../editing/v3-body-validation';
import { planV3TextEdit } from '../editing/v3-text-edit-operations';
import { planV3Paste } from '../editing/v3-paste-operations';
import { planV3ColumnOperation } from '../columns/v3/v3-column-operations';
import { completeV3ColumnConsequences } from '../columns/v3/v3-column-consequences';
import { planV3ColumnEdit } from '../columns/v3/v3-column-edit';
import {
    V3OperationError,
    v3OwnerOperation,
    type V3BlockOperation,
    type V3OperationContext,
    type V3OperationDraft,
    type V3PreparedOperation,
} from './v3-transaction-types';

export function requireV3EditableState(state: EditorState) {
    if (state.readOnly || !state.facet(EditorView.editable))
        throw new V3OperationError(
            'read-only',
            'This owning document is not editable.',
        );
    if (state.selection.ranges.length !== 1)
        throw new V3OperationError(
            'multiple-selections',
            'Resolve multiple text carets before a structural block command.',
        );
    if (!state.field(historyField, false))
        throw new V3OperationError(
            'missing-history',
            'Structural commands require the existing owner history.',
        );
    const structure = state.field(v3StructureField, false);
    if (!structure?.current.valid)
        throw new V3OperationError(
            'invalid-source',
            'A valid V3 owner index is required; repair the source first.',
        );
    return structure.current;
}

export const v3OwnerTransactionExtensions = [
    v3StructureField,
    markdownBlockHistoryMotion,
];

function v3FocusPosition(
    source: Text,
    index: V3DocumentIndex,
    draft: V3OperationDraft,
) {
    if (!draft.focus) return 0;
    const block = index.blockById(draft.focus.blockId);
    if (!block)
        throw new V3OperationError(
            'missing-focus',
            'The resulting focus block is missing.',
        );
    let from = block.bodyFrom;
    let length = block.bodyTo - block.bodyFrom;
    if (draft.focus.sourceOffset !== undefined)
        return from + Math.max(0, Math.min(length, draft.focus.sourceOffset));
    try {
        const text = readV3TextBody(
            {
                state: {
                    doc: source,
                    sliceDoc: (from = 0, to = source.length) =>
                        source.sliceString(from, to),
                },
                index,
            },
            block,
        );
        from = text.contentFrom;
        length = text.content.length;
        if (draft.focus.includeTrailing && !text.metadata)
            length += text.trailing.length;
    } catch (error) {
        if (
            !(error instanceof V3OperationError) ||
            error.code !== 'opaque-body'
        )
            throw error;
    }
    return (
        from +
        (draft.focus.bodyOffset === 'end'
            ? length
            : Math.min(
                  draft.focus.bodyOffset === 0
                      ? v3TextPrefixLength(
                            block.type,
                            source.sliceString(from, from + length),
                        )
                      : draft.focus.bodyOffset,
                  length,
              ))
    );
}

export function prepareV3Operation(request: {
    owner: object;
    state: EditorState;
    operation: V3BlockOperation;
    preserveSelection?: boolean;
    linkedMoveId?: string;
}): V3PreparedOperation {
    const { state, operation } = request;
    const index = requireV3EditableState(state);
    if (
        ('type' in operation && !isV3BlockType(operation.type)) ||
        ('body' in operation && typeof operation.body !== 'string')
    )
        throw new V3OperationError(
            'invalid-operation',
            'The operation has an unsupported explicit type or body.',
        );
    let identities: Set<string> | null = null;
    const context: V3OperationContext = {
        state,
        index,
        allocateIdentity: () => {
            identities ??= new Set(
                [...index.structure.blocks, ...index.structure.columns].map(
                    (entry) => entry.id,
                ),
            );
            for (let attempt = 0; attempt < 8; attempt++) {
                const id = createV3Identity();
                if (!identities.has(id)) {
                    identities.add(id);
                    return id;
                }
            }
            throw new V3OperationError(
                'identity-collision',
                'Could not allocate a unique block identity. No source was changed.',
            );
        },
    };
    const draft =
        planV3TransferInsertion(context, operation) ??
        planV3ColumnEdit(context, operation) ??
        planV3ColumnOperation(context, operation) ??
        planV3TextEdit(context, operation) ??
        planV3Paste(context, operation) ??
        planV3StructureOperation(context, operation) ??
        planV3TextOperation(context, operation);
    const columnConsequences = completeV3ColumnConsequences(
        context,
        draft,
        operation,
    );
    const changes = state.changes(draft.changes);
    const candidate = changes.apply(state.doc);
    if (candidate.eq(state.doc))
        throw new V3OperationError(
            'unchanged-source',
            'The command would not change this document.',
        );
    const mappedCandidate = columnConsequences
        ? columnConsequences.mappedBody
            ? columnConsequences.structure
            : null
        : mapV3OrdinaryBodyChanges(index, {
              before: state.doc,
              after: candidate,
              changes,
          });
    const ordinaryColumnEdit =
        operation.kind === 'edit-column' && mappedCandidate !== null;
    const nextIndex = new V3DocumentIndex(
        columnConsequences?.structure ??
            mappedCandidate ??
            parseV3Structure(candidate),
    );
    //
    // The owner field has not changed yet. Validate the candidate before creating history, focus or motion consequences.
    //
    const rangeBlocks = draft.afterIds
        .map((id) => nextIndex.blockById(id))
        .filter((block) => block !== null);
    if (!nextIndex.valid) {
        const issue = nextIndex.structure.diagnostics[0];
        throw new V3OperationError(
            issue.code,
            `${issue.message} (source line ${issue.line})`,
        );
    }
    for (const block of nextIndex.structure.blocks)
        if (
            !ordinaryColumnEdit &&
            (draft.affectedIds.has(block.id) ||
                draft.createdBlocks.has(block.id)) &&
            !isV3BodyTypeValid(
                candidate.sliceString(block.bodyFrom, block.bodyTo),
                block.type,
            )
        )
            throw new V3OperationError(
                'body-type-mismatch',
                `The operation would leave a ${block.type} block with incompatible content. No source was changed.`,
            );
    //
    // Checked native deltas plus the mapped-body scanner prove identity and untouched-source preservation without rereading every other body on each keystroke.
    //
    if (!ordinaryColumnEdit)
        assertV3OperationIntegrity(
            context,
            draft,
            {
                sliceDoc: (from = 0, to = candidate.length) =>
                    candidate.sliceString(from, to),
            },
            nextIndex,
        );
    const after = rangeBlocks.length
        ? {
              from: rangeBlocks[0].from,
              to: rangeBlocks[rangeBlocks.length - 1].to,
          }
        : undefined;
    const move =
        draft.movedRange && after
            ? { ...draft.movedRange, destination: after.from }
            : undefined;
    const selectedColumn =
        draft.columnSelection &&
        nextIndex.columnById(draft.columnSelection.columnId);
    if (draft.columnSelection && !selectedColumn)
        throw new V3OperationError(
            'missing-column-selection',
            'The edited column is no longer available.',
        );
    const selection =
        draft.columnSelection && selectedColumn
            ? EditorSelection.single(
                  selectedColumn.bodyFrom + draft.columnSelection.anchor,
                  selectedColumn.bodyFrom + draft.columnSelection.head,
              )
            : request.preserveSelection
              ? state.selection.map(changes)
              : EditorSelection.single(
                    v3FocusPosition(candidate, nextIndex, draft),
                );
    //
    // Editing rows must stay live: move snapshots hide the viewport's rows and are only appropriate for deliberate block actions.
    //
    const animate =
        operation.motion !== 'none' &&
        ![
            'edit-text',
            'exit-text',
            'advance-empty',
            'replace-body',
            'edit-column',
        ].includes(operation.kind);
    const motionEffect = animate
        ? markdownBlockMotionEffect.of({
              before: draft.before,
              after,
          })
        : null;
    const typing =
        (operation.kind === 'edit-column' ||
            operation.kind === 'replace-body') &&
        /^(?:input\.type(?:\.|$)|delete\.(?:backward|forward)(?:\.|$))/.test(
            operation.userEvent ?? '',
        );
    const userEvent = typing
        ? operation.userEvent!
        : `${operation.kind === 'delete' ? 'delete' : operation.kind === 'move' ? 'move' : 'input'}.v3.${operation.kind}`;
    const transaction = state.update({
        changes,
        selection,
        userEvent,
        annotations: [
            v3OwnerOperation.of(true),
            ...(typing ? [] : [isolateHistory.of('full')]),
            ...(move ? [richBlockMove.of(move)] : []),
        ],
        effects: [
            ...(motionEffect ? [motionEffect] : []),
            ...linkedMarkdownMoveEffect(request.linkedMoveId),
        ],
        scrollIntoView:
            operation.kind !== 'edit-column' && !request.preserveSelection,
    });
    if (
        !transaction.newDoc.eq(candidate) ||
        !transaction.newSelection.eq(selection) ||
        transaction.annotation(isolateHistory) !==
            (typing ? undefined : 'full') ||
        transaction.annotation(v3OwnerOperation) !== true ||
        transaction.annotation(Transaction.userEvent) !== userEvent ||
        (motionEffect && !transaction.effects.includes(motionEffect)) ||
        (move && transaction.annotation(richBlockMove) !== move)
    )
        throw new V3OperationError(
            'filtered-operation',
            'An owner filter changed the structural transaction or selection.',
        );
    if (transaction.annotation(Transaction.addToHistory) === false)
        throw new V3OperationError(
            'history-rejected',
            'A structural command must remain one undoable owner action.',
        );
    if (ordinaryColumnEdit) {
        const structure = transaction.state.field(v3StructureField);
        if (
            !structure.current.valid ||
            structure.updateKind !== 'mapped-body' ||
            structure.source !== transaction.newDoc
        )
            throw new V3OperationError(
                'filtered-column-edit',
                'The owner did not preserve this checked body edit.',
            );
    } else
        assertV3OperationIntegrity(
            context,
            draft,
            transaction.state,
            transaction.state.field(v3StructureField).current,
        );
    return {
        animate,
        owner: request.owner,
        startState: state,
        source: state.doc,
        operation: operation.kind,
        transaction,
        before: draft.before,
        after,
        move,
        copiedIds: draft.copiedIds,
        createdIds: [
            ...draft.createdBlocks.keys(),
            ...draft.createdColumns.keys(),
        ],
        removedIds: [...draft.removedBlocks, ...draft.removedColumns],
        compositionBodyBlockId:
            operation.kind === 'replace-body' ? operation.blockId : undefined,
        compositionColumnId:
            operation.kind === 'edit-column' ? operation.columnId : undefined,
    };
}

export function assertV3PreparedOwner(request: {
    owner: object;
    state: EditorState;
    prepared: V3PreparedOperation;
}) {
    const { owner, state, prepared } = request;
    requireV3EditableState(state);
    if (
        prepared.owner !== owner ||
        prepared.startState !== state ||
        prepared.source !== state.doc ||
        prepared.transaction.startState !== state
    )
        throw new V3OperationError(
            'stale-operation',
            'The owner source, selection or permissions changed. Prepare the command again.',
        );
}
