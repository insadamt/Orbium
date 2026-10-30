// Summary: Coordinates block drag gestures, scrolling and atomic column/split moves; depends on existing block targets and the column drop resolver.
import { resolveColumnDrop } from '../columns/column-drop';
import {
    scrollMarkdownDrag,
    scrollMarkdownDragBy,
} from './markdown-drag-scroll';
import { measureHostProjection } from './markdown-drag-pointer';
import { EditorView, type ViewUpdate } from '@codemirror/view';
import type { Text } from '@codemirror/state';
import {
    moveMarkdownBlock,
    type MarkdownBlockRange,
} from './markdown-block-actions';
import {
    markdownBlockElement,
    createMarkdownBlockDragPreview,
} from './markdown-block-drag';
import {
    markdownBlockDragDocuments,
    markdownBlockDragHost,
    markdownHostPointer,
    resolveMarkdownSplitBlockTarget,
    collectMarkdownSplitTransferPreviews,
} from './markdown-split-block-targets';
import { removeTransferredMarkdownBlock } from './markdown-block-transfer';
import { performLinkedMarkdownMove } from './markdown-linked-move-history';
import { markdownBlockMotion } from './markdown-block-motion';
import { preserveMarkdownDropViewport } from './markdown-drop-viewport';
import { captureMarkdownDragPointer } from './markdown-drag-pointer';

type MarkdownBlockDragOptions = {
    view: EditorView;
    handle: HTMLButtonElement;
    currentBlock: () => MarkdownBlockRange | null;
    onStart: () => void;
    onNotice: (message: string) => void;
};

type BlockDragSession = {
    block: MarkdownBlockRange;
    doc: Text;
    pointerId: number;
    startX: number;
    startY: number;
    clientX: number;
    clientY: number;
    readPointer: () => { clientX: number; clientY: number };
    started: boolean;
    element: HTMLElement | null;
    preview: HTMLElement | null;
};

export class MarkdownBlockDragController {
    private session: BlockDragSession | null = null;
    private indicator = document.createElement('div');
    private frame: number | null = null;
    private previousFrameTime = 0;
    private eventDocuments = new Set<Document>();
    private clickReset: ReturnType<typeof setTimeout> | null = null;
    suppressHandleClick = false;

    constructor(private readonly options: MarkdownBlockDragOptions) {
        // Native HTML dragging suppresses device input, including wheel input in some browsers.
        options.handle.draggable = false;
        options.handle.style.touchAction = 'none';
        options.handle.addEventListener('pointerdown', this.pressHandle);
        options.handle.addEventListener('lostpointercapture', this.end);
        this.indicator.className = 'orbium-markdown-drop-indicator';
        this.indicator.hidden = true;
        markdownBlockDragHost(options.view).document.body.append(
            this.indicator,
        );
    }

    get active() {
        return this.session !== null;
    }

    private canMove() {
        const { view } = this.options;
        return (
            view.state.facet(EditorView.editable) &&
            !view.state.readOnly &&
            !view.compositionStarted
        );
    }

    private pressHandle = (event: PointerEvent) => {
        const block = this.options.currentBlock();
        if (event.button !== 0 || !event.isPrimary || !block || !this.canMove())
            return;
        event.preventDefault();
        event.stopPropagation();
        this.finish();
        this.session = {
            block,
            doc: this.options.view.state.doc,
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            clientX: event.clientX,
            clientY: event.clientY,
            readPointer: captureMarkdownDragPointer(this.options.view, event),
            started: false,
            element: null,
            preview: null,
        };
        this.options.handle.setPointerCapture(event.pointerId);
        document.addEventListener('pointermove', this.movePointer, true);
        document.addEventListener('pointerup', this.releasePointer, true);
        document.addEventListener('pointercancel', this.end, true);
        this.eventDocuments = markdownBlockDragDocuments(this.options.view);
        for (const eventDocument of this.eventDocuments) {
            eventDocument.addEventListener('wheel', this.scrollWheel, {
                capture: true,
                passive: false,
            });
            eventDocument.addEventListener(
                'scroll',
                this.refreshAfterScroll,
                true,
            );
            eventDocument.addEventListener(
                'keydown',
                this.cancelWithEscape,
                true,
            );
        }
        window.addEventListener('blur', this.end);
    };

    private startDrag(session: BlockDragSession) {
        session.started = true;
        session.element = markdownBlockElement(
            this.options.view,
            session.block,
        );
        session.element?.classList.add('editor-block-dragging');
        session.preview = createMarkdownBlockDragPreview(session.block);
        markdownBlockDragHost(this.options.view).document.body.append(
            session.preview,
        );
        this.suppressHandleClick = true;
        if (this.clickReset !== null) clearTimeout(this.clickReset);
        this.options.onNotice('');
        this.options.onStart();
    }

    private movePointer = (event: PointerEvent) => {
        const session = this.session;
        if (!session || event.pointerId !== session.pointerId) return;
        session.clientX = event.clientX;
        session.clientY = event.clientY;
        session.readPointer = captureMarkdownDragPointer(
            this.options.view,
            event,
        );
        if (!session.started) {
            if (
                Math.hypot(
                    event.clientX - session.startX,
                    event.clientY - session.startY,
                ) < 5
            )
                return;
            this.startDrag(session);
        }
        event.preventDefault();
        event.stopPropagation();
        this.refreshTarget();
        this.scheduleScrollFrame();
    };

    private pointerTarget(session: BlockDragSession) {
        return resolveMarkdownSplitBlockTarget(this.options.view, session);
    }

    private refreshTarget() {
        const session = this.session;
        if (!session?.started) return;
        Object.assign(session, session.readPointer());
        if (session.preview) {
            const pointer = markdownHostPointer(this.options.view, session);
            session.preview.style.left = `${pointer.clientX + 16}px`;
            session.preview.style.top = `${pointer.clientY + 16}px`;
        }
        const columnTarget = this.canMove()
            ? resolveColumnDrop(this.options.view, session.block, session)
            : null;
        if (columnTarget) {
            const projection = measureHostProjection(this.options.view);
            const position = markdownHostPointer(this.options.view, {
                clientX: columnTarget.left,
                clientY: columnTarget.top,
            });
            this.indicator.hidden = false;
            this.indicator.dataset.columnDrop = 'true';
            this.indicator.style.top = `${position.clientY}px`;
            this.indicator.style.left = `${position.clientX}px`;
            this.indicator.style.width = `${columnTarget.width * projection.scaleX}px`;
            this.indicator.style.height = `${columnTarget.height * projection.scaleY}px`;
            return;
        }
        delete this.indicator.dataset.columnDrop;
        this.indicator.style.height = '';
        const target = this.canMove() ? this.pointerTarget(session) : null;
        this.indicator.hidden =
            !target ||
            !target.visible ||
            (target.endpoint.view === this.options.view &&
                target.block.from === session.block.from);
        if (!target) return;
        this.indicator.style.top = `${target.top}px`;
        this.indicator.style.left = `${target.left}px`;
        this.indicator.style.width = `${target.width}px`;
    }

    private refreshAfterScroll = () => this.refreshTarget();

    private scheduleScrollFrame() {
        if (this.frame !== null) return;
        this.previousFrameTime = performance.now();
        this.frame = requestAnimationFrame(this.scrollFrame);
    }

    private scrollFrame = (time: number) => {
        this.frame = null;
        const session = this.session;
        if (!session?.started) return;
        Object.assign(session, session.readPointer());
        const columns = resolveColumnDrop(
            this.options.view,
            session.block,
            session,
        );
        const target = columns ? null : this.pointerTarget(session);
        const continueEdgeScroll = columns
            ? scrollMarkdownDrag(
                  columns.owner,
                  session,
                  time - this.previousFrameTime,
              )
            : target?.endpoint.scroll(
                  target.pointer,
                  time - this.previousFrameTime,
              );
        this.previousFrameTime = time;
        this.refreshTarget();
        if (continueEdgeScroll)
            this.frame = requestAnimationFrame(this.scrollFrame);
    };

    private scrollWheel = (event: WheelEvent) => {
        const session = this.session;
        if (!session?.started || event.ctrlKey) return;
        const columns = resolveColumnDrop(
            this.options.view,
            session.block,
            session,
        );
        if (columns) {
            event.preventDefault();
            event.stopPropagation();
            const unit =
                event.deltaMode === 1
                    ? columns.owner.defaultLineHeight
                    : event.deltaMode === 2
                      ? columns.owner.dom.clientHeight
                      : 1;
            scrollMarkdownDragBy(columns.owner, event.deltaY * unit);
            this.refreshTarget();
            this.scheduleScrollFrame();
            return;
        }
        const target = this.pointerTarget(session);
        if (!target) return;
        event.preventDefault();
        event.stopPropagation();
        target.endpoint.wheel(event);
        this.refreshTarget();
        this.scheduleScrollFrame();
    };

    private releasePointer = (event: PointerEvent) => {
        const session = this.session;
        if (!session || event.pointerId !== session.pointerId) return;
        session.readPointer = captureMarkdownDragPointer(
            this.options.view,
            event,
        );
        Object.assign(session, session.readPointer());
        const columnTarget =
            session.started && this.canMove()
                ? resolveColumnDrop(this.options.view, session.block, session)
                : null;
        const target =
            session.started && this.canMove()
                ? this.pointerTarget({
                      ...session,
                      clientX: event.clientX,
                      clientY: event.clientY,
                  })
                : null;
        if (session.started) {
            event.preventDefault();
            event.stopPropagation();
        }
        this.finish();
        if (columnTarget && session.doc === this.options.view.state.doc) {
            try {
                columnTarget.apply();
            } catch (error) {
                this.options.onNotice(
                    error instanceof Error
                        ? error.message
                        : 'Could not move this block into columns.',
                );
            }
            return;
        }
        if (
            !session.started ||
            !target ||
            !target.visible ||
            session.doc !== this.options.view.state.doc
        )
            return;
        try {
            if (target.endpoint.view !== this.options.view) {
                const previews = collectMarkdownSplitTransferPreviews(
                    this.options.view,
                    session.block,
                );
                performLinkedMarkdownMove({
                    source: this.options.view,
                    target: target.endpoint.view,
                    block: session.block,
                    perform: (id) => {
                        const snapshot = this.options.view
                            .plugin(markdownBlockMotion)
                            ?.capture(session.block);
                        try {
                            const inserted = target.endpoint.insert(
                                session.block,
                                target,
                                previews,
                                id,
                            );
                            removeTransferredMarkdownBlock(
                                this.options.view,
                                session.block,
                                { moveId: id, snapshot },
                            );
                            return inserted;
                        } catch (error) {
                            snapshot?.ghost?.element.remove();
                            throw error;
                        }
                    },
                });
                target.endpoint.view.focus();
                return;
            }
            preserveMarkdownDropViewport(this.options.view, {
                targetBlock: target.block,
                placement: target.placement,
                moveBlock: () =>
                    moveMarkdownBlock(
                        this.options.view,
                        session.block,
                        target.block,
                        target.placement,
                        { preserveViewport: true },
                    ),
            });
        } catch (error) {
            this.options.onNotice(
                error instanceof Error
                    ? error.message
                    : 'Could not move this block.',
            );
        }
    };

    private cancelWithEscape = (event: KeyboardEvent) => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        event.stopPropagation();
        this.finish();
    };

    private end = () => this.finish();

    private finish() {
        const session = this.session;
        this.session = null;
        session?.element?.classList.remove('editor-block-dragging');
        session?.preview?.remove();
        this.indicator.hidden = true;
        if (this.frame !== null) cancelAnimationFrame(this.frame);
        this.frame = null;
        document.removeEventListener('pointermove', this.movePointer, true);
        document.removeEventListener('pointerup', this.releasePointer, true);
        document.removeEventListener('pointercancel', this.end, true);
        for (const eventDocument of this.eventDocuments) {
            eventDocument.removeEventListener('wheel', this.scrollWheel, true);
            eventDocument.removeEventListener(
                'scroll',
                this.refreshAfterScroll,
                true,
            );
            eventDocument.removeEventListener(
                'keydown',
                this.cancelWithEscape,
                true,
            );
        }
        this.eventDocuments.clear();
        window.removeEventListener('blur', this.end);
        if (session && this.options.handle.hasPointerCapture(session.pointerId))
            this.options.handle.releasePointerCapture(session.pointerId);
        if (this.suppressHandleClick) {
            if (this.clickReset !== null) clearTimeout(this.clickReset);
            this.clickReset = setTimeout(() => {
                this.suppressHandleClick = false;
                this.clickReset = null;
            }, 0);
        }
    }

    update(update: ViewUpdate) {
        if (!this.session) return;
        if (update.docChanged || !this.canMove()) {
            if (update.docChanged)
                this.options.onNotice(
                    'The document changed during the drag. Drag the block again.',
                );
            this.finish();
        }
    }

    destroy() {
        this.finish();
        if (this.clickReset !== null) clearTimeout(this.clickReset);
        this.options.handle.removeEventListener(
            'pointerdown',
            this.pressHandle,
        );
        this.options.handle.removeEventListener('lostpointercapture', this.end);
        this.indicator.remove();
    }
}
