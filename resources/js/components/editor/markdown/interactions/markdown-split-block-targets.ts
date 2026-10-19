import { EditorView } from '@codemirror/view';
import type { MarkdownLimits } from '../markdown-api';
import { markdownBlockDropTarget } from './markdown-block-drag';
import type { MarkdownBlockRange } from './markdown-block-actions';
import type { RichContext } from '../rich/rich-model';
import { registerLinkedMarkdownHistory } from './markdown-linked-move-history';
import { stageTransferredMediaPlayers } from '../rich/transferred-media-players';
import {
    cacheRichTransferPreviews,
    collectRichTransferPreviews,
    type RichTransferPreviews,
} from '../rich/rich-transfer-previews';
import { measureHostProjection } from './markdown-drag-pointer';
import {
    markdownDragViewport,
    scrollMarkdownDrag,
    scrollMarkdownDragBy,
} from './markdown-drag-scroll';
import { preserveMarkdownDropViewport } from './markdown-drop-viewport';
import {
    insertTransferredMarkdownBlock,
    prepareTransferredMarkdownInsertion,
    type MarkdownDropTarget,
} from './markdown-block-transfer';

type Pointer = { clientX: number; clientY: number };
type SplitBlockTarget = {
    localOnly: boolean;
    view: EditorView;
    workspaceId: number;
    nodeId: number;
    resolve: (pointer: Pointer) => ResolvedSplitBlockTarget | null;
    collectPreviews: (block: MarkdownBlockRange) => RichTransferPreviews;
    insert: (
        block: MarkdownBlockRange,
        target: MarkdownDropTarget,
        previews?: RichTransferPreviews,
        moveId?: string,
    ) => MarkdownBlockRange;
    scroll: (pointer: Pointer, elapsed: number) => boolean;
    wheel: (event: WheelEvent) => void;
};

export type ResolvedSplitBlockTarget = MarkdownDropTarget & {
    endpoint: SplitBlockTarget;
    pointer: Pointer;
    top: number;
    left: number;
    width: number;
    visible: boolean;
};

type BlockDragHost = Window & {
    orbiumMarkdownBlockTargets?: Set<SplitBlockTarget>;
};

export function markdownBlockDragHost(view: EditorView): BlockDragHost {
    return (view.dom.ownerDocument.defaultView?.top ?? window) as BlockDragHost;
}

function registeredTargets(view: EditorView) {
    const host = markdownBlockDragHost(view);
    return (host.orbiumMarkdownBlockTargets ??= new Set());
}

function isMarkdownEditorRendered(view: EditorView) {
    let element: HTMLElement | null = view.dom;
    while (element) {
        const bounds = element.getBoundingClientRect();
        if (
            !bounds.width ||
            !bounds.height ||
            element.closest('[hidden], [inert]')
        )
            return false;
        element = element.ownerDocument.defaultView
            ?.frameElement as HTMLElement | null;
    }
    return true;
}

export function markdownHostPointer(view: EditorView, pointer: Pointer) {
    const projection = measureHostProjection(view);
    return {
        clientX: pointer.clientX * projection.scaleX + projection.offsetX,
        clientY: pointer.clientY * projection.scaleY + projection.offsetY,
    };
}

export function markdownBlockDragDocuments(view: EditorView) {
    return new Set([
        markdownBlockDragHost(view).document,
        view.dom.ownerDocument,
        ...[...registeredTargets(view)].map(
            (target) => target.view.dom.ownerDocument,
        ),
    ]);
}

export function resolveMarkdownSplitBlockTarget(
    source: EditorView,
    pointer: Pointer,
) {
    const endpoints = registeredTargets(source);
    const sourceEndpoint = [...endpoints].find(
        (entry) => entry.view === source,
    );
    if (!sourceEndpoint) return null;
    const hostPointer = markdownHostPointer(source, pointer);
    for (const endpoint of endpoints) {
        if (
            ((sourceEndpoint.localOnly || endpoint.localOnly) &&
                endpoint !== sourceEndpoint) ||
            endpoint.workspaceId !== sourceEndpoint.workspaceId ||
            (endpoint !== sourceEndpoint &&
                endpoint.nodeId === sourceEndpoint.nodeId)
        )
            continue;
        const target = endpoint.resolve(hostPointer);
        if (target) return target;
    }
    return null;
}

export function collectMarkdownSplitTransferPreviews(
    source: EditorView,
    block: MarkdownBlockRange,
) {
    return [...registeredTargets(source)]
        .find((endpoint) => endpoint.view === source)
        ?.collectPreviews(block);
}

export function registerMarkdownSplitBlockTarget(options: {
    localOnly?: boolean;
    view: EditorView;
    workspaceId: number;
    nodeId: number;
    limits: MarkdownLimits;
    richContext: RichContext;
    isVisible: () => boolean;
    onNotice: (message: string) => void;
}) {
    const { view } = options;
    const preparePreviews = (
        previews: RichTransferPreviews,
        range: MarkdownBlockRange,
    ) => {
        cacheRichTransferPreviews(options.richContext, previews);
        return stageTransferredMediaPlayers(
            options.richContext,
            previews.players,
            range,
        );
    };
    const unregisterHistory = registerLinkedMarkdownHistory({
        view,
        collect: (range) =>
            collectRichTransferPreviews(view, range, options.richContext),
        prepare: preparePreviews,
        notice: options.onNotice,
        available: () =>
            view.dom.isConnected &&
            options.isVisible() &&
            view.state.facet(EditorView.editable) &&
            !view.state.readOnly &&
            !view.compositionStarted,
    });
    const endpoint: SplitBlockTarget = {
        localOnly: options.localOnly ?? false,
        view,
        workspaceId: options.workspaceId,
        nodeId: options.nodeId,
        collectPreviews: (block) =>
            collectRichTransferPreviews(view, block, options.richContext),
        resolve(hostPointer) {
            if (
                !options.isVisible() ||
                !view.dom.isConnected ||
                !isMarkdownEditorRendered(view) ||
                !view.state.facet(EditorView.editable) ||
                view.state.readOnly ||
                view.compositionStarted ||
                view.dom
                    .closest('[data-live-preview]')
                    ?.getAttribute('data-live-preview') !== 'true'
            )
                return null;
            const projection = measureHostProjection(view);
            const pointer = {
                clientX:
                    (hostPointer.clientX - projection.offsetX) /
                    projection.scaleX,
                clientY:
                    (hostPointer.clientY - projection.offsetY) /
                    projection.scaleY,
            };
            const viewport = markdownDragViewport(view);
            if (
                pointer.clientX < viewport.left ||
                pointer.clientX > viewport.right ||
                pointer.clientY < viewport.top ||
                pointer.clientY > viewport.bottom
            )
                return null;
            // Resolve inside the owning realm: iframe DOM nodes have different constructors.
            const target = markdownBlockDropTarget(view, pointer);
            if (!target) return null;
            const bounds = view.contentDOM.getBoundingClientRect();
            return {
                ...target,
                visible:
                    target.top >= viewport.top && target.top <= viewport.bottom,
                endpoint,
                pointer,
                top: target.top * projection.scaleY + projection.offsetY,
                left: bounds.left * projection.scaleX + projection.offsetX,
                width: bounds.width * projection.scaleX,
            };
        },
        insert(block, target, previews, moveId) {
            const insertion = prepareTransferredMarkdownInsertion({
                view,
                block,
                target,
                limits: options.limits,
            });
            const from = insertion.insertedFrom;
            const insertedRange = {
                ...block,
                from,
                to: from + block.source.length,
            };
            const release =
                previews && preparePreviews(previews, insertedRange);
            try {
                preserveMarkdownDropViewport(view, {
                    targetBlock: target.block,
                    placement: target.placement,
                    moveBlock: () =>
                        insertTransferredMarkdownBlock(
                            view,
                            block,
                            insertion,
                            moveId,
                        ),
                });
                return insertedRange;
            } finally {
                if (release) queueMicrotask(release);
            }
        },
        scroll: (pointer, elapsed) =>
            scrollMarkdownDrag(view, pointer, elapsed),
        wheel(event) {
            const viewport = markdownDragViewport(view);
            const unit =
                event.deltaMode === 1
                    ? view.defaultLineHeight
                    : event.deltaMode === 2
                      ? viewport.bottom - viewport.top
                      : 1;
            scrollMarkdownDragBy(view, event.deltaY * unit);
        },
    };
    const endpoints = registeredTargets(view);
    endpoints.add(endpoint);
    return () => {
        unregisterHistory();
        endpoints.delete(endpoint);
    };
}
