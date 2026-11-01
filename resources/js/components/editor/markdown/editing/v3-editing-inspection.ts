// Summary: Mounts a disposable local V3 keyboard review surface with no application save/import hooks; depends on the production editing extensions and owner history, and preserves one state across raw/live review switches.
import { Compartment, EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import {
    defaultKeymap,
    history,
    historyKeymap,
    undoDepth,
    redoDepth,
} from '@codemirror/commands';
import { v3OwnerTransactionExtensions } from '../transactions/v3-transaction-plan';
import { v3StructureField } from '../structure/v3-structure-state';
import { readV3EditableText } from './v3-editable-text';
import {
    v3LiveEditingExtensions,
    selectV3BlockFromHandle,
} from './v3-live-editing';
import { v3BlockSelectionField } from './v3-block-selection';
import { V3OperationError } from '../transactions/v3-transaction-types';
import { v3ColumnWidgets } from '../columns/v3/v3-column-widgets';
import { focusV3OwnerColumnSelection } from '../columns/v3/v3-column-registry';
import { executeV3Operation } from '../transactions/v3-transaction-dispatch';
import type { V3BlockOperation } from '../transactions/v3-transaction-types';

export function mountV3EditingInspection(request: {
    parent: HTMLElement;
    source: string;
    clipboardScope?: string;
    columns?: boolean;
}) {
    const mode = new Compartment();
    const permissions = new Compartment();
    const errors: string[] = [];
    const embeddedTargets = new WeakMap<Element, string>();
    let available = true;
    let sourceMode = false;
    const live = v3LiveEditingExtensions({
        isAvailable: () => available,
        clipboardScope: request.clipboardScope ?? 'manual-review',
        renderColumnLayouts: request.columns,
        onError: (error) => {
            errors.push(error.message);
        },
        resolveEmbeddedBlock: (target) => {
            for (
                let element = target instanceof Element ? target : null;
                element && element !== request.parent;
                element = element.parentElement
            ) {
                const id = embeddedTargets.get(element);
                if (id) return id;
            }
            return null;
        },
    });
    const liveMode = [
        live,
        request.columns
            ? v3ColumnWidgets({
                  clipboardScope: request.clipboardScope ?? 'manual-review',
                  isAvailable: () => available,
                  onError: (error) => {
                      errors.push(error.message);
                  },
              })
            : [],
    ];
    const view = new EditorView({
        parent: request.parent,
        state: EditorState.create({
            doc: request.source,
            extensions: [
                history(),
                v3OwnerTransactionExtensions,
                permissions.of([]),
                mode.of(liveMode),
                keymap.of([...defaultKeymap, ...historyKeymap]),
                EditorView.lineWrapping,
            ],
        }),
    });
    return {
        view,
        applyOperation(operation: V3BlockOperation) {
            return executeV3Operation({
                view,
                operation,
                isAvailable: () => available,
            });
        },
        inspect() {
            const structure = view.state.field(v3StructureField);
            return {
                source: view.state.doc.toString(),
                valid: structure.current.valid,
                structure: structure.current.structure,
                selection: view.state.selection.main.toJSON(),
                selectedBlocks:
                    view.state.field(v3BlockSelectionField, false) ?? null,
                undoDepth: undoDepth(view.state),
                redoDepth: redoDepth(view.state),
                sourceMode,
                errors: [...errors],
            };
        },
        focusBlock(blockId: string, offset = 0) {
            const index = view.state.field(v3StructureField).current;
            const block = index.blockById(blockId);
            if (!block)
                throw new V3OperationError(
                    'missing-block',
                    'This review block is unavailable.',
                );
            let from = block.bodyFrom;
            let length = block.bodyTo - from;
            try {
                const text = readV3EditableText(view.state, index, block);
                from = text.from;
                length = text.to - from;
            } catch (error) {
                if (
                    !(error instanceof V3OperationError) ||
                    error.code !== 'opaque-body'
                )
                    throw error;
            }
            view.dispatch({
                selection: {
                    anchor: from + Math.max(0, Math.min(offset, length)),
                },
                scrollIntoView: true,
            });
            view.focus();
            if (request.columns)
                queueMicrotask(() => focusV3OwnerColumnSelection(view));
        },
        selectBlock(blockId: string, extend = false) {
            selectV3BlockFromHandle(view, blockId, extend);
        },
        setSourceMode(value: boolean) {
            sourceMode = value;
            view.dispatch({ effects: mode.reconfigure(value ? [] : liveMode) });
        },
        setReadOnly(value: boolean) {
            view.dispatch({
                effects: permissions.reconfigure([
                    EditorState.readOnly.of(value),
                    EditorView.editable.of(!value),
                ]),
            });
        },
        setAvailable(value: boolean) {
            available = value;
        },
        registerEmbeddedTarget(element: Element, blockId: string) {
            embeddedTargets.set(element, blockId);
            return () => embeddedTargets.delete(element);
        },
        destroy() {
            available = false;
            view.destroy();
        },
    };
}
