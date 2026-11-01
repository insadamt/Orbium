// Summary: Preserves abandoned empty paragraphs as spacers and trims unused trailing writing rows; depends on current owner/projection IDs, checked text bodies and deferred owner commands.
import { ViewPlugin } from '@codemirror/view';
import { v3StructureField } from '../structure/v3-structure-state';
import { v3BlockSelectionField } from '../editing/v3-block-selection';
import { isV3TextType, readV3TextBody } from '../transactions/v3-text-body';
import {
    trimV3TrailingWritingRows,
    hasV3TrailingWritingRows,
    v3ContentWithoutTrailingRows,
} from '../editing/v3-empty-space-operations';
import { dispatchV3ProductOperation } from './v3-product-commands';
import { isV3BlockMovePending } from './v3-move-persistence';
import { markdownUploadAnchor } from '../markdown-upload-anchor';
import { executeV3Operation } from '../transactions/v3-transaction-dispatch';
import { v3ColumnProjectionFor } from '../columns/v3/v3-column-registry';

export const v3EmptyLineCleanup = ViewPlugin.define((view) => {
    let destroyed = false;
    return {
        update(update) {
            const lostFocus =
                update.focusChanged &&
                !view.hasFocus &&
                !view.dom.contains(view.root.activeElement);
            if (
                (!update.selectionSet && !lostFocus) ||
                !view.state.selection.main.empty ||
                !update.startState.selection.main.empty ||
                view.composing ||
                view.compositionStarted ||
                view.state.field(v3BlockSelectionField, false)
            )
                return;
            const before = update.startState
                .field(v3StructureField)
                .current.blockAt(update.startState.selection.main.head);
            const after = view.state
                .field(v3StructureField)
                .current.blockAt(view.state.selection.main.head);
            if (
                !before ||
                (before.id === after?.id &&
                    !lostFocus &&
                    (update.docChanged ||
                        view.state.doc
                            .lineAt(view.state.selection.main.head)
                            .text.trim())) ||
                !isV3TextType(before.type)
            )
                return;
            //
            // Publishing inside a CodeMirror update is forbidden; resolve the ID again after selection/projection updates settle.
            //
            queueMicrotask(() => {
                if (
                    destroyed ||
                    !view.dom.isConnected ||
                    view.composing ||
                    view.compositionStarted ||
                    !view.state.selection.main.empty ||
                    view.state.field(v3BlockSelectionField, false)
                )
                    return;
                if (
                    lostFocus &&
                    (view.hasFocus ||
                        view.dom.contains(view.root.activeElement))
                )
                    return;
                const index = view.state.field(v3StructureField).current;
                const block = index.blockById(before.id);
                if (
                    !block ||
                    isV3BlockMovePending(block.id) ||
                    view.state.field(markdownUploadAnchor, false)?.blockId ===
                        block.id ||
                    !isV3TextType(block.type)
                )
                    return;
                try {
                    const model = readV3TextBody(
                        { state: view.state, index },
                        block,
                    );
                    const caretInBlock =
                        index.blockAt(view.state.selection.main.head)?.id ===
                        block.id;
                    if (!model.content.trim()) {
                        if (
                            (lostFocus || !caretInBlock) &&
                            block.type === 'paragraph'
                        )
                            //
                            // Leaving an unused writing block expresses intentional spacing; keep its identity and position instead of deleting the user's blank row.
                            //
                            dispatchV3ProductOperation(
                                view,
                                {
                                    kind: 'replace-block',
                                    blockId: block.id,
                                    type: 'spacer',
                                    body: '\n',
                                    motion: 'none',
                                },
                                false,
                            );
                        return;
                    }
                    if (!hasV3TrailingWritingRows(model)) return;
                    const caretInRemovedTail =
                        caretInBlock &&
                        view.state.selection.main.head >
                            model.contentFrom +
                                v3ContentWithoutTrailingRows(model).length;
                    if (caretInBlock && !lostFocus && !caretInRemovedTail)
                        return;
                    const body = trimV3TrailingWritingRows(model);
                    if (
                        body !==
                        view.state.sliceDoc(block.bodyFrom, block.bodyTo)
                    ) {
                        const owner =
                            v3ColumnProjectionFor(view)?.owner ?? view;
                        //
                        // A caret inside deleted whitespace must move to visible text, even on blur; preserving its mapped position would strand it on the next hidden header.
                        //
                        executeV3Operation({
                            view: owner,
                            operation: {
                                kind: 'replace-body',
                                blockId: block.id,
                                body,
                                focus: 'end',
                                motion: 'none',
                            },
                            focusEditor: false,
                            preserveSelection: !caretInRemovedTail,
                            isAvailable: () =>
                                owner.dom.isConnected &&
                                !owner.dom.closest('[hidden], [inert]'),
                        });
                    }
                } catch {
                    //
                    // Cleanup is optional; composing, opaque, stale or unavailable owners must retain their exact source.
                    //
                }
            });
        },
        destroy() {
            destroyed = true;
        },
    };
});
