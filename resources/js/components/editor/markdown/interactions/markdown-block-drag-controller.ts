import { EditorView, type ViewUpdate } from '@codemirror/view';
import type { Text } from '@codemirror/state';
import {
    moveMarkdownBlock,
    type MarkdownBlockRange,
} from './markdown-block-actions';
import {
    markdownBlockDropTarget,
    markdownBlockElement,
    createMarkdownBlockDragPreview,
} from './markdown-block-drag';
import {
    markdownDragViewport,
    scrollMarkdownDrag,
    scrollMarkdownDragBy,
} from './markdown-drag-scroll';
import { preserveMarkdownDropViewport } from './markdown-drop-viewport';

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
    started: boolean;
    element: HTMLElement | null;
    preview: HTMLElement | null;
};

export class MarkdownBlockDragController {
    private session: BlockDragSession | null = null;
    private indicator = document.createElement('div');
    private frame: number | null = null;
    private previousFrameTime = 0;
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
        document.body.append(this.indicator);
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
            started: false,
            element: null,
            preview: null,
        };
        this.options.handle.setPointerCapture(event.pointerId);
        document.addEventListener('pointermove', this.movePointer, true);
        document.addEventListener('pointerup', this.releasePointer, true);
        document.addEventListener('pointercancel', this.end, true);
        document.addEventListener('wheel', this.scrollWheel, {
            capture: true,
            passive: false,
        });
        document.addEventListener('scroll', this.refreshAfterScroll, true);
        document.addEventListener('keydown', this.cancelWithEscape, true);
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
        const target = document.elementFromPoint(
            session.clientX,
            session.clientY,
        );
        if (!target || !this.options.view.dom.contains(target)) return null;
        return markdownBlockDropTarget(this.options.view, {
            ...session,
            target,
        });
    }

    private refreshTarget() {
        const session = this.session;
        if (!session?.started) return;
        if (session.preview) {
            session.preview.style.left = `${session.clientX + 16}px`;
            session.preview.style.top = `${session.clientY + 16}px`;
        }
        const target = this.canMove() ? this.pointerTarget(session) : null;
        this.indicator.hidden =
            !target || target.block.from === session.block.from;
        if (!target) return;
        const bounds = this.options.view.contentDOM.getBoundingClientRect();
        const viewport = markdownDragViewport(this.options.view);
        this.indicator.hidden ||=
            target.top < viewport.top || target.top > viewport.bottom;
        this.indicator.style.top = `${target.top}px`;
        this.indicator.style.left = `${bounds.left}px`;
        this.indicator.style.width = `${bounds.width}px`;
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
        if (!session?.started || !this.pointerTarget(session)) return;
        const scrolled = scrollMarkdownDrag(
            this.options.view,
            session.clientY,
            time - this.previousFrameTime,
        );
        this.previousFrameTime = time;
        this.refreshTarget();
        if (scrolled) this.frame = requestAnimationFrame(this.scrollFrame);
    };

    private scrollWheel = (event: WheelEvent) => {
        const session = this.session;
        if (!session?.started || event.ctrlKey || !this.pointerTarget(session))
            return;
        event.preventDefault();
        event.stopPropagation();
        const viewport = markdownDragViewport(this.options.view);
        const unit =
            event.deltaMode === WheelEvent.DOM_DELTA_LINE
                ? this.options.view.defaultLineHeight
                : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
                  ? viewport.bottom - viewport.top
                  : 1;
        scrollMarkdownDragBy(this.options.view, event.deltaY * unit);
        this.refreshTarget();
        this.scheduleScrollFrame();
    };

    private releasePointer = (event: PointerEvent) => {
        const session = this.session;
        if (!session || event.pointerId !== session.pointerId) return;
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
        if (
            !session.started ||
            !target ||
            session.doc !== this.options.view.state.doc
        )
            return;
        try {
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
        document.removeEventListener('wheel', this.scrollWheel, true);
        document.removeEventListener('scroll', this.refreshAfterScroll, true);
        document.removeEventListener('keydown', this.cancelWithEscape, true);
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
