// Summary: Exposes manual V3 command/undo/redo inspection on one isolated owner state without mounting or saving a Document; depends on the production planner, owner history extensions and live-style stale/read-only guards.
import {
    history,
    undo,
    redo,
    undoDepth,
    redoDepth,
} from '@codemirror/commands';
import {
    Compartment,
    EditorState,
    type ChangeSpec,
    type Transaction,
} from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { v3StructureField } from '../structure/v3-structure-state';
import {
    v3BlockSelectionField,
    v3BlockSelectionTransaction,
    v3SelectAllField,
    v3SelectAllTransaction,
} from '../editing/v3-block-selection';
import {
    resolveV3KeyboardOperation,
    type V3EditingKey,
} from '../editing/v3-keyboard-operations';
import {
    selectedV3BlockClipboard,
    resolveV3PasteOperation,
} from '../editing/v3-editing-clipboard';
import { captureV3SelectionDrag } from '../editing/v3-selection-drag';
import {
    assertV3PreparedOwner,
    prepareV3Operation,
    v3OwnerTransactionExtensions,
} from './v3-transaction-plan';
import {
    V3OperationError,
    type V3BlockOperation,
    type V3PreparedOperation,
    type V3InsertionTarget,
} from './v3-transaction-types';
import { readV3ColumnModel } from '../columns/v3/v3-column-model';

type V3ManualColumnEdit = {
    columnId: string;
    edits: readonly { from: number; to: number; insert: string }[];
    selection: { anchor: number; head: number };
    userEvent?: string;
};

export function createV3TransactionInspection(source: string) {
    const owner = {};
    const permissions = new Compartment();
    let composing = false;
    let state = EditorState.create({
        doc: source,
        extensions: [
            history(),
            v3OwnerTransactionExtensions,
            v3BlockSelectionField,
            v3SelectAllField,
            permissions.of([
                EditorState.readOnly.of(false),
                EditorView.editable.of(true),
            ]),
        ],
    });

    function inspect() {
        const current = state.field(v3StructureField);
        return {
            source: state.doc.toString(),
            valid: current.current.valid,
            structure: current.current.structure,
            lastValidSource: current.lastValid?.source.toString() ?? null,
            selection: state.selection.main.toJSON(),
            undoDepth: undoDepth(state),
            redoDepth: redoDepth(state),
            readOnly: state.readOnly,
            composing,
            selectedBlocks: state.field(v3BlockSelectionField),
            layouts: current.current.structure.blocks
                .filter(
                    (block) =>
                        block.type === 'columns' && current.current.valid,
                )
                .map((block) => {
                    const model = readV3ColumnModel(current.current, block.id);
                    return {
                        id: block.id,
                        widths: model.widths,
                        columns: model.columns.map((column) => ({
                            id: column.id,
                            childIds: current.current
                                .blocksIn(column.id)
                                .map((child) => child.id),
                        })),
                    };
                }),
        };
    }

    function assertNotComposing() {
        if (composing)
            throw new V3OperationError(
                'composing-owner',
                'Finish text composition before changing block structure.',
            );
    }

    function applyPrepared(prepared: V3PreparedOperation) {
        assertNotComposing();
        assertV3PreparedOwner({ owner, state, prepared });
        state = prepared.transaction.state;
        return {
            ...inspect(),
            createdIds: [...prepared.createdIds],
            removedIds: [...prepared.removedIds],
            copiedIds: Object.fromEntries(prepared.copiedIds),
        };
    }

    function applyHistory(direction: 'undo' | 'redo') {
        assertNotComposing();
        if (state.readOnly || !state.facet(EditorView.editable))
            throw new V3OperationError(
                'read-only',
                'This owning document is not editable.',
            );
        const changed = (direction === 'undo' ? undo : redo)({
            state,
            dispatch: (transaction: Transaction) => {
                state = transaction.state;
            },
        });
        return { ...inspect(), changed };
    }

    function applyOperation(operation: V3BlockOperation) {
        assertNotComposing();
        return applyPrepared(prepareV3Operation({ owner, state, operation }));
    }

    function prepareColumnEdit(request: V3ManualColumnEdit) {
        assertNotComposing();
        return prepareV3Operation({
            owner,
            state,
            operation: {
                kind: 'edit-column',
                ...request,
                ownerSource: state.doc,
                userEvent: request.userEvent ?? 'input.type',
            },
        });
    }

    return {
        inspect,
        prepare(operation: V3BlockOperation, preserveSelection = false) {
            assertNotComposing();
            return prepareV3Operation({
                owner,
                state,
                operation,
                preserveSelection,
            });
        },
        applyPrepared,
        applyOperation,
        prepareColumnEdit,
        applyColumnEdit(request: V3ManualColumnEdit) {
            return applyPrepared(prepareColumnEdit(request));
        },
        pressKey(key: V3EditingKey, blockId?: string) {
            assertNotComposing();
            const selected = state.field(v3BlockSelectionField);
            const operation =
                selected && (key === 'Backspace' || key === 'Delete')
                    ? {
                          kind: 'delete' as const,
                          blockIds: selected.ids,
                          ensureParagraph: true,
                      }
                    : resolveV3KeyboardOperation({
                          state,
                          key,
                          blockId:
                              blockId ??
                              (key === 'Shift-Enter'
                                  ? selected?.ids.at(-1)
                                  : undefined),
                      });
            return operation
                ? { ...applyOperation(operation), handled: true }
                : { ...inspect(), handled: false };
        },
        selectBlock(blockId: string, extend = false) {
            state = state.update(
                v3BlockSelectionTransaction(state, blockId, extend),
            ).state;
            return inspect();
        },
        selectAll() {
            const transaction = v3SelectAllTransaction(state);
            if (transaction) state = state.update(transaction).state;
            return inspect();
        },
        copyBlocks(scope = 'manual-review') {
            return selectedV3BlockClipboard(state, scope);
        },
        captureDrag(grabbedId: string) {
            const captured = captureV3SelectionDrag({
                owner,
                state,
                grabbedId,
            });
            return {
                ids: captured.ids,
                range: captured.range,
                prepareMove(target: V3InsertionTarget) {
                    return prepareV3Operation({
                        owner,
                        state,
                        operation: captured.createMove({
                            owner,
                            state,
                            target,
                        }),
                    });
                },
            };
        },
        pasteText(text: string, native?: string, scope = 'manual-review') {
            assertNotComposing();
            const operation = resolveV3PasteOperation({
                state,
                text,
                native,
                scope,
            });
            return operation ? applyOperation(operation) : inspect();
        },
        applyRawSourceChanges(changes: ChangeSpec) {
            state = state.update({ changes, userEvent: 'input.review' }).state;
            return inspect();
        },
        setSelection(anchor: number, head = anchor) {
            state = state.update({
                selection: { anchor, head },
                userEvent: 'select.review',
            }).state;
            return inspect();
        },
        setReadOnly(readOnly: boolean) {
            state = state.update({
                effects: permissions.reconfigure([
                    EditorState.readOnly.of(readOnly),
                    EditorView.editable.of(!readOnly),
                ]),
            }).state;
            return inspect();
        },
        setComposing(value: boolean) {
            composing = value;
            return inspect();
        },
        undo() {
            return applyHistory('undo');
        },
        redo() {
            return applyHistory('redo');
        },
    };
}
