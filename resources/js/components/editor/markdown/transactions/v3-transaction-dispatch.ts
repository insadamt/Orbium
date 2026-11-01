// Summary: Applies one prevalidated V3 owner transaction with existing motion/widget retention and live permission/IME guards; depends on the owner view, transaction planner and existing history/motion services.
import { isV3EmbeddedComposing } from '../editing/v3-composition';
import { v3StructureField } from '../structure/v3-structure-state';
import { assertV3DraftRangeWritable } from '../runtime/v3-rich-draft';
import type { EditorView } from '@codemirror/view';
import {
    focusV3OwnerColumnSelection,
    isV3ColumnComposing,
    v3ColumnProjectionFor,
    resolveV3ColumnPosition,
} from '../columns/v3/v3-column-registry';
import {
    columnEditorOwner,
    isColumnEditorComposing,
} from '../columns/column-registry';
import { isMindMapComposing } from '@/components/mindmap/mindmap-composition';
import { preserveRichWidgetsDuringMove } from '../rich/rich-widget-move';
import {
    markdownBlockMotion,
    type MarkdownBlockMotionSnapshot,
} from '../interactions/markdown-block-motion';
import {
    assertV3PreparedOwner,
    prepareV3Operation,
} from './v3-transaction-plan';
import {
    V3OperationError,
    type V3BlockOperation,
    type V3PreparedOperation,
} from './v3-transaction-types';

type V3OwnerDispatch = {
    view: EditorView;
    isAvailable: () => boolean;
    focusEditor?: boolean;
    compositionSource?: EditorView;
};

function assertV3LiveOwner(
    request: V3OwnerDispatch,
    composingBodyBlockId?: string,
) {
    const { view } = request;
    if (
        !view.dom.isConnected ||
        view.dom.closest('[hidden], [inert]') ||
        !request.isAvailable()
    )
        throw new V3OperationError(
            'unavailable-owner',
            'The owning document is no longer active and editable.',
        );
    if (
        columnEditorOwner(view) ||
        view.dom.parentElement?.closest('.cm-editor')
    )
        throw new V3OperationError(
            'nested-owner',
            'Delegate this operation to the authoritative owner, not a nested editor.',
        );
    if (
        view.compositionStarted ||
        view.composing ||
        (!composingBodyBlockId &&
            isV3ColumnComposing(view, request.compositionSource)) ||
        isColumnEditorComposing(view.dom) ||
        (isMindMapComposing(view.dom) && !composingBodyBlockId) ||
        isV3EmbeddedComposing(view, {
            exceptEditor: request.compositionSource,
            exceptBlockId: composingBodyBlockId,
        })
    )
        throw new V3OperationError(
            'composing-owner',
            'Finish text composition before changing block structure.',
        );
}

export function applyV3PreparedOperation(
    request: V3OwnerDispatch & { prepared: V3PreparedOperation },
): { applied: true; warning?: string } {
    const { view, prepared } = request;
    if (request.compositionSource) {
        const projection = v3ColumnProjectionFor(request.compositionSource);
        if (
            prepared.operation !== 'edit-column' ||
            projection?.owner !== view ||
            projection.columnId !== prepared.compositionColumnId
        )
            throw new V3OperationError(
                'invalid-composition-owner',
                'The native edit does not belong to this composing projection.',
            );
    }
    assertV3LiveOwner(request, prepared.compositionBodyBlockId);
    assertV3PreparedOwner({ owner: view, state: view.state, prepared });
    assertV3DraftRangeWritable(view, prepared);
    const motion = view.plugin(markdownBlockMotion);
    let snapshot: MarkdownBlockMotionSnapshot | null | undefined;
    let applied = false;
    try {
        snapshot = !prepared.animate ? null : motion?.capture(prepared.before);
        const dispatch = () => {
            assertV3LiveOwner(request, prepared.compositionBodyBlockId);
            assertV3PreparedOwner({ owner: view, state: view.state, prepared });
            view.dispatch(prepared.transaction);
            applied = view.state === prepared.transaction.state;
            if (!applied)
                throw new V3OperationError(
                    'owner-dispatch-rejected',
                    'The owner dispatcher did not accept the prepared transaction.',
                );
            if (snapshot)
                motion?.play(
                    snapshot,
                    prepared.transaction.changes,
                    prepared.after,
                );
        };
        if (prepared.move)
            preserveRichWidgetsDuringMove(
                view,
                prepared.move,
                prepared.transaction.changes,
                dispatch,
            );
        else dispatch();
        if (request.focusEditor !== false) {
            view.focus();
            queueMicrotask(() => {
                if (view.dom.isConnected && request.isAvailable())
                    focusV3OwnerColumnSelection(view);
            });
        }
        return { applied: true };
    } catch (error) {
        applied ||= view.state === prepared.transaction.state;
        let cleanupWarning = '';
        try {
            if (prepared.animate) motion?.finish();
        } catch (cleanupError) {
            cleanupWarning =
                cleanupError instanceof Error
                    ? cleanupError.message
                    : 'Motion cleanup failed.';
        } finally {
            snapshot?.ghost?.element.remove();
        }
        //
        // Motion/focus failures after a committed text transaction must not be reported as an unperformed command that invites duplication.
        //
        if (applied)
            return {
                applied: true,
                warning: [
                    error instanceof Error
                        ? error.message
                        : 'The source changed, but visual cleanup did not complete.',
                    cleanupWarning,
                ]
                    .filter(Boolean)
                    .join(' '),
            };
        throw error;
    }
}

export function executeV3Operation(
    request: V3OwnerDispatch & {
        operation: V3BlockOperation;
        preserveSelection?: boolean;
    },
) {
    if (request.compositionSource) {
        const projection = v3ColumnProjectionFor(request.compositionSource);
        if (
            request.operation.kind !== 'edit-column' ||
            projection?.owner !== request.view ||
            projection.columnId !== request.operation.columnId
        )
            throw new V3OperationError(
                'invalid-composition-owner',
                'Only the registered originating column may publish its native composition.',
            );
    }
    assertV3LiveOwner(
        request,
        request.operation.kind === 'replace-body'
            ? request.operation.blockId
            : undefined,
    );
    const prepared = prepareV3Operation({
        owner: request.view,
        state: request.view.state,
        operation: request.operation,
        preserveSelection: request.preserveSelection,
    });
    const applied = applyV3PreparedOperation({ ...request, prepared });
    if (
        request.focusEditor !== false &&
        ['replace-block', 'insert'].includes(prepared.operation)
    ) {
        //
        // Owner focus queues column synchronization first; activate the retained dedicated input only after its local selection has caught up.
        //
        queueMicrotask(() =>
            queueMicrotask(() => {
                if (!request.view.dom.isConnected || !request.isAvailable())
                    return;
                const projected = resolveV3ColumnPosition(
                    request.view,
                    request.view.state.selection.main.head,
                );
                const view = projected?.view ?? request.view;
                const block = view.state
                    .field(v3StructureField)
                    .current.blockAt(view.state.selection.main.head);
                if (
                    !block ||
                    /^(paragraph|heading-[1-6]|bullet-list|numbered-list|checklist|quote)$/.test(
                        block.type,
                    )
                )
                    return;
                const widget = [
                    ...view.dom.querySelectorAll<HTMLElement>(
                        '[data-rich-from]',
                    ),
                ].find(
                    (element) =>
                        element.closest('.cm-editor') === view.dom &&
                        Number(element.dataset.richFrom) >= block.bodyFrom &&
                        Number(element.dataset.richFrom) < block.to,
                );
                widget?.dispatchEvent(new Event('orbium-edit-rich'));
            }),
        );
    }
    return { ...applied, prepared };
}
