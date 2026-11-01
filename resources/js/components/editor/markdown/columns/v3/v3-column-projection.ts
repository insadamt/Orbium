// Summary: Mounts a column as a disposable projection of the canonical owner with no child history; depends on V3 editing commands, checked native deltas and owner-only undo/redo.
import {
    Annotation,
    Compartment,
    EditorSelection,
    EditorState,
    Transaction,
    type Extension,
} from '@codemirror/state';
import { EditorView, keymap, placeholder } from '@codemirror/view';
import { defaultKeymap, undo, redo } from '@codemirror/commands';
import { v3StructureField } from '../../structure/v3-structure-state';
import { executeV3Operation } from '../../transactions/v3-transaction-dispatch';
import {
    V3OperationError,
    v3OwnerOperation,
    type V3BlockOperation,
} from '../../transactions/v3-transaction-types';
import { v3LiveEditingExtensions } from '../../editing/v3-live-editing';
import { normalizeV3HeaderSelection } from '../../editing/v3-live-selection';
import {
    v3BlockSelectionField,
    v3SelectBlocks,
} from '../../editing/v3-block-selection';
import {
    focusV3OwnerColumnSelection,
    registerV3ColumnProjection,
} from './v3-column-registry';

const v3ProjectionSynchronization = Annotation.define<boolean>();

export function mountV3ColumnProjection(options: {
    owner: EditorView;
    host: HTMLElement;
    columnId: string;
    index: number;
    clipboardScope: string;
    renderRichBodies?: boolean;
    isAvailable: () => boolean;
    onError: (error: Error) => void;
    extensions?: Extension;
}) {
    const permission = new Compartment();
    let destroyed = false;
    let scheduled = false;
    let projectionSource = '';
    let projectedOwnerSource = options.owner.state.doc;
    const enabled = () =>
        options.isAvailable() &&
        !options.owner.state.readOnly &&
        options.owner.state.facet(EditorView.editable);
    function currentColumn() {
        const column = options.owner.state
            .field(v3StructureField)
            .current.columnById(options.columnId);
        if (!column)
            throw new V3OperationError(
                'missing-projected-column',
                'The owner no longer contains this column.',
            );
        return column;
    }
    function sourceInOwner() {
        const column = currentColumn();
        const framingLength =
            column.bodyTo > column.bodyFrom &&
            options.owner.state.sliceDoc(column.bodyTo - 1, column.bodyTo) ===
                '\n'
                ? 1
                : 0;
        return options.owner.state.sliceDoc(
            column.bodyFrom,
            column.bodyTo - framingLength,
        );
    }
    projectionSource = sourceInOwner();
    function report(error: unknown) {
        options.onError(
            error instanceof Error
                ? error
                : new Error('The column operation failed.'),
        );
    }
    function assertCurrentProjection() {
        if (
            destroyed ||
            !options.host.isConnected ||
            options.host.closest('[hidden], [inert]') ||
            !enabled()
        )
            throw new V3OperationError(
                'unavailable-column',
                'This column is no longer available for editing.',
            );
        if (options.owner.state.doc !== projectedOwnerSource)
            throw new V3OperationError(
                'stale-column-projection',
                'The owner changed this column. Refresh before editing.',
            );
    }
    function translateOperation(operation: V3BlockOperation): V3BlockOperation {
        const column = currentColumn();
        if ('from' in operation && 'to' in operation)
            return {
                ...operation,
                from: column.bodyFrom + operation.from,
                to: column.bodyFrom + operation.to,
            };
        if ('target' in operation)
            return {
                ...operation,
                target: { ...operation.target, parentId: column.id },
            };
        return operation;
    }
    function dispatchOperation(_view: EditorView, operation: V3BlockOperation) {
        assertCurrentProjection();
        const result = executeV3Operation({
            view: options.owner,
            operation: translateOperation(operation),
            isAvailable: options.isAvailable,
        });
        if (result.warning) report(new Error(result.warning));
        refresh();
    }
    function selectDocument() {
        const roots = options.owner.state
            .field(v3StructureField)
            .current.blocksIn(null);
        options.owner.dispatch({
            selection: EditorSelection.single(
                0,
                options.owner.state.doc.length,
            ),
            effects:
                options.owner.state.field(v3BlockSelectionField, false) !==
                undefined
                    ? v3SelectBlocks.of(
                          roots.length
                              ? {
                                    anchorId: roots[0].id,
                                    headId: roots.at(-1)!.id,
                                    ids: roots.map((block) => block.id),
                                }
                              : null,
                      )
                    : [],
            userEvent: 'select.v3.document',
        });
        options.owner.focus();
        return true;
    }
    function applyHistory(direction: 'undo' | 'redo') {
        try {
            assertCurrentProjection();
            if (view.composing || view.compositionStarted) return false;
            const changed = (direction === 'undo' ? undo : redo)({
                state: options.owner.state,
                dispatch: (transaction: Transaction) =>
                    options.owner.dispatch(transaction),
            });
            if (changed) {
                refresh();
                queueMicrotask(() => {
                    if (
                        !destroyed &&
                        !focusV3OwnerColumnSelection(options.owner)
                    )
                        options.owner.focus();
                });
            }
            return changed;
        } catch (error) {
            report(error);
            return true;
        }
    }
    const view = new EditorView({
        parent: options.host,
        state: EditorState.create({
            doc: projectionSource,
            //
            // A fresh projection must start in its first body rather than at the hidden identity header at offset zero.
            //
            selection: EditorSelection.single(
                normalizeV3HeaderSelection(
                    options.owner.state,
                    EditorSelection.cursor(
                        options.owner.state
                            .field(v3StructureField)
                            .current.blocksIn(options.columnId)[0].from,
                    ),
                ).head - currentColumn().bodyFrom,
            ),
            extensions: [
                v3StructureField,
                v3LiveEditingExtensions({
                    isAvailable: enabled,
                    renderRichBodies: options.renderRichBodies,
                    clipboardScope: options.clipboardScope,
                    onError: report,
                    dispatchOperation,
                    selectDocument,
                }),
                permission.of([
                    EditorView.editable.of(enabled()),
                    EditorState.readOnly.of(!enabled()),
                ]),
                options.extensions ?? [],
                EditorView.lineWrapping,
                EditorView.editorAttributes.of({
                    class: 'orbium-column-editor',
                    'data-live-preview': 'true',
                }),
                EditorView.contentAttributes.of({
                    'aria-label': `Column ${options.index + 1}`,
                    spellcheck: 'true',
                }),
                placeholder('Write, or press /…'),
                keymap.of([
                    {
                        key: 'Mod-z',
                        run: () => applyHistory('undo'),
                        preventDefault: true,
                    },
                    {
                        key: 'Mod-Shift-z',
                        run: () => applyHistory('redo'),
                        preventDefault: true,
                    },
                    {
                        key: 'Mod-y',
                        run: () => applyHistory('redo'),
                        preventDefault: true,
                    },
                    ...defaultKeymap,
                ]),
            ],
        }),
        dispatchTransactions(transactions, child) {
            if (
                transactions.every((transaction) =>
                    transaction.annotation(v3ProjectionSynchronization),
                )
            ) {
                child.update(transactions);
                return;
            }
            try {
                if (
                    !transactions.some((transaction) => transaction.docChanged)
                ) {
                    child.update(transactions);
                    if (
                        transactions.some(
                            (transaction) => transaction.selection,
                        ) &&
                        options.isAvailable()
                    ) {
                        const column = currentColumn();
                        const selection = child.state.selection.main;
                        const next = EditorSelection.single(
                            column.bodyFrom + selection.anchor,
                            column.bodyFrom + selection.head,
                        );
                        if (!options.owner.state.selection.eq(next))
                            options.owner.dispatch({
                                selection: next,
                                userEvent: 'select.v3.column',
                            });
                    }
                    return;
                }
                assertCurrentProjection();
                let changes = transactions[0].changes;
                for (const transaction of transactions.slice(1))
                    changes = changes.compose(transaction.changes);
                const edits: { from: number; to: number; insert: string }[] =
                    [];
                changes.iterChanges((from, to, _newFrom, _newTo, inserted) => {
                    edits.push({ from, to, insert: inserted.toString() });
                });
                const last = transactions.at(-1)!;
                const selection = last.newSelection.main;
                const userEvent =
                    transactions
                        .find((transaction) => transaction.docChanged)
                        ?.annotation(Transaction.userEvent) ?? 'input.type';
                const result = executeV3Operation({
                    view: options.owner,
                    isAvailable: options.isAvailable,
                    focusEditor: false,
                    compositionSource: child,
                    operation: {
                        kind: 'edit-column',
                        columnId: options.columnId,
                        ownerSource: projectedOwnerSource,
                        edits,
                        selection: {
                            anchor: selection.anchor,
                            head: selection.head,
                        },
                        userEvent,
                    },
                });
                child.update(transactions);
                projectedOwnerSource = options.owner.state.doc;
                if (result.warning) report(new Error(result.warning));
            } catch (error) {
                report(error);
                refresh();
            }
        },
    });
    function synchronize() {
        scheduled = false;
        if (destroyed || view.composing || view.compositionStarted) return;
        try {
            if (options.owner.state.doc === projectedOwnerSource) {
                view.dispatch({
                    effects: permission.reconfigure([
                        EditorView.editable.of(enabled()),
                        EditorState.readOnly.of(!enabled()),
                    ]),
                    annotations: v3ProjectionSynchronization.of(true),
                });
                return;
            }
            const next = sourceInOwner();
            const before = view.state.doc;
            const beforeText = before.toString();
            let from = 0;
            while (
                from < before.length &&
                from < next.length &&
                beforeText[from] === next[from]
            )
                from++;
            let oldTo = before.length;
            let newTo = next.length;
            while (
                oldTo > from &&
                newTo > from &&
                beforeText[oldTo - 1] === next[newTo - 1]
            ) {
                oldTo--;
                newTo--;
            }
            view.dispatch({
                changes:
                    from === oldTo && from === newTo
                        ? []
                        : { from, to: oldTo, insert: next.slice(from, newTo) },
                effects: permission.reconfigure([
                    EditorView.editable.of(enabled()),
                    EditorState.readOnly.of(!enabled()),
                ]),
                annotations: [
                    v3ProjectionSynchronization.of(true),
                    v3OwnerOperation.of(true),
                    Transaction.addToHistory.of(false),
                ],
            });
            projectionSource = next;
            projectedOwnerSource = options.owner.state.doc;
        } catch (error) {
            if (
                options.owner.state
                    .field(v3StructureField)
                    .current.columnById(options.columnId)
            )
                report(error);
        }
    }
    function refresh() {
        if (!destroyed && !scheduled) {
            scheduled = true;
            queueMicrotask(synchronize);
        }
    }
    function focus(ownerPosition: number) {
        queueMicrotask(() => {
            if (destroyed || !view.dom.isConnected) return;
            const column = currentColumn();
            const selection = options.owner.state.selection.main;
            const local = (position: number) =>
                Math.max(
                    0,
                    Math.min(view.state.doc.length, position - column.bodyFrom),
                );
            view.dispatch({
                selection: EditorSelection.single(
                    local(selection.anchor),
                    local(ownerPosition),
                ),
                annotations: v3ProjectionSynchronization.of(true),
                scrollIntoView: true,
            });
            view.focus();
        });
    }
    const unregister = registerV3ColumnProjection({
        owner: options.owner,
        view,
        columnId: options.columnId,
        refresh,
        focus,
        selectionBlockId: () =>
            view.state.field(v3BlockSelectionField)?.ids.at(-1) ??
            view.state
                .field(v3StructureField)
                .current.blockAt(view.state.selection.main.head)?.id ??
            null,
    });
    view.contentDOM.addEventListener('compositionend', refresh);
    return {
        view,
        refresh,
        focus,
        destroy() {
            destroyed = true;
            unregister();
            view.contentDOM.removeEventListener('compositionend', refresh);
            queueMicrotask(() => view.destroy());
        },
    };
}
