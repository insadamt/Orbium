import { Annotation, type ChangeSet } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import type { RichBlock, RichContext } from './rich-model';

type BlockMove = { from: number; to: number; destination: number };
export const richBlockMove = Annotation.define<BlockMove>();

type MountedWidget = {
    view: EditorView;
    root: HTMLElement;
    block: RichBlock;
    context: RichContext;
    dispose: () => void;
};
type RetainedWidget = {
    widget: MountedWidget;
    destination: number;
    claimed: boolean;
    deferredDisposal: boolean;
};
const mountedWidgets = new WeakMap<EditorView, Set<MountedWidget>>();
const rootWidgets = new WeakMap<HTMLElement, MountedWidget>();
const retainedWidgets = new WeakMap<HTMLElement, RetainedWidget>();
const activeMoves = new WeakMap<EditorView, RetainedWidget[]>();

export function registerMountedRichWidget(widget: MountedWidget) {
    let widgets = mountedWidgets.get(widget.view);
    if (!widgets) mountedWidgets.set(widget.view, (widgets = new Set()));
    widgets.add(widget);
    rootWidgets.set(widget.root, widget);
}

export function updateMountedRichWidget(root: HTMLElement, block: RichBlock) {
    const widget = rootWidgets.get(root);
    if (widget) widget.block = block;
}

export function unregisterMountedRichWidget(root: HTMLElement) {
    const widget = rootWidgets.get(root);
    if (widget) mountedWidgets.get(widget.view)?.delete(widget);
    rootWidgets.delete(root);
}

function matchesRetainedWidget(
    retained: RetainedWidget,
    block: RichBlock,
    context: RichContext,
) {
    return (
        retained.destination === block.from &&
        retained.widget.context === context &&
        retained.widget.block.kind === block.kind &&
        retained.widget.block.source === block.source
    );
}

export function canUpdateRetainedRichWidget(
    root: HTMLElement,
    block: RichBlock,
    context: RichContext,
) {
    const retained = retainedWidgets.get(root);
    return !retained || matchesRetainedWidget(retained, block, context);
}

export function claimRetainedRichWidget(root: HTMLElement) {
    const retained = retainedWidgets.get(root);
    if (retained) retained.claimed = true;
}

export function findRetainedRichWidget(
    view: EditorView,
    block: RichBlock,
    context: RichContext,
) {
    const retained = activeMoves
        .get(view)
        ?.find(
            (candidate) =>
                !candidate.claimed &&
                matchesRetainedWidget(candidate, block, context),
        );
    return retained?.widget.root ?? null;
}

export function deferRichWidgetDisposal(root: HTMLElement) {
    const retained = retainedWidgets.get(root);
    if (!retained) return false;
    retained.deferredDisposal = true;
    return true;
}

export function preserveRichWidgetsDuringMove(
    view: EditorView,
    move: BlockMove,
    changes: ChangeSet,
    applyMove: () => void,
) {
    const retained = Array.from(mountedWidgets.get(view) ?? [], (widget) => ({
        widget,
        destination:
            widget.block.from >= move.from && widget.block.to <= move.to
                ? move.destination + widget.block.from - move.from
                : changes.mapPos(widget.block.from, 1),
        claimed: false,
        deferredDisposal: false,
    }));
    const playingMedia = retained.flatMap(({ widget }) =>
        Array.from(
            widget.root.querySelectorAll<HTMLMediaElement>('video, audio'),
        ).filter((media) => !media.paused && !media.ended),
    );
    activeMoves.set(view, retained);
    for (const candidate of retained)
        retainedWidgets.set(candidate.widget.root, candidate);
    try {
        applyMove();
    } finally {
        activeMoves.delete(view);
        for (const candidate of retained) {
            retainedWidgets.delete(candidate.widget.root);
            if (
                candidate.deferredDisposal &&
                (!candidate.claimed || !candidate.widget.root.isConnected)
            )
                candidate.widget.dispose();
        }
        // Browsers can pause media when CodeMirror relocates its existing DOM node.
        for (const media of playingMedia)
            if (media.isConnected && media.paused)
                void media.play().catch(() => {});
    }
}
