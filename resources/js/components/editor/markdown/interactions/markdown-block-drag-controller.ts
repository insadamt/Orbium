import { EditorView, type ViewUpdate } from '@codemirror/view';
import type { Text } from '@codemirror/state';
import {
    moveMarkdownBlock,
    type MarkdownBlockRange,
} from './markdown-block-actions';
import {
    markdownBlockDropTarget,
    markdownBlockElement,
    showMarkdownBlockDragPreview,
} from './markdown-block-drag';
import {
    markdownDragViewport,
    scrollMarkdownDrag,
} from './markdown-drag-scroll';

const blockDragType = 'application/x-orbium-block';

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
    element: HTMLElement | null;
    pointer: {
        clientX: number;
        clientY: number;
        target: EventTarget | null;
    } | null;
};

export class MarkdownBlockDragController {
    private session: BlockDragSession | null = null;
    private indicator = document.createElement('div');
    private frame: number | null = null;
    private previousFrameTime = 0;
    private clickReset: ReturnType<typeof setTimeout> | null = null;
    suppressHandleClick = false;

    constructor(private readonly options: MarkdownBlockDragOptions) {
        options.handle.draggable = true;
        options.handle.addEventListener('dragstart', this.start);
        options.handle.addEventListener('dragend', this.end);
        // Capture block drops before CodeMirror or nested rich editors can insert text.
        options.view.dom.addEventListener('dragover', this.overEditor, true);
        options.view.dom.addEventListener('drop', this.drop, true);
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

    private start = (event: DragEvent) => {
        const block = this.options.currentBlock();
        if (!block || !event.dataTransfer || !this.canMove()) {
            event.preventDefault();
            return;
        }
        event.stopPropagation();
        this.finish();
        this.options.onNotice('');
        const { view } = this.options;
        const element = markdownBlockElement(view, block);
        this.session = { block, doc: view.state.doc, element, pointer: null };
        element?.classList.add('editor-block-dragging');
        event.dataTransfer.setData(blockDragType, String(block.from));
        event.dataTransfer.effectAllowed = 'move';
        showMarkdownBlockDragPreview(event, block);
        this.suppressHandleClick = true;
        if (this.clickReset !== null) clearTimeout(this.clickReset);
        this.options.onStart();
        document.addEventListener('dragover', this.trackPointer, true);
        document.addEventListener('drop', this.dropOutside, true);
        document.addEventListener('keydown', this.cancelWithEscape, true);
        window.addEventListener('blur', this.end);
    };

    private overEditor = (event: DragEvent) => {
        if (!event.dataTransfer?.types.includes(blockDragType)) return;
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect =
            this.session && this.canMove() ? 'move' : 'none';
    };

    private trackPointer = (event: DragEvent) => {
        if (!this.session) return;
        this.session.pointer = this.options.view.dom.contains(
            event.target as Node,
        )
            ? {
                  clientX: event.clientX,
                  clientY: event.clientY,
                  target: event.target,
              }
            : null;
        this.refreshTarget();
        if (this.session.pointer && this.frame === null) {
            this.previousFrameTime = performance.now();
            this.frame = requestAnimationFrame(this.scrollFrame);
        }
    };

    private refreshTarget() {
        const session = this.session;
        const target =
            session?.pointer && this.canMove()
                ? markdownBlockDropTarget(this.options.view, {
                      ...session.pointer,
                      target: document.elementFromPoint(
                          session.pointer.clientX,
                          session.pointer.clientY,
                      ),
                  })
                : null;
        this.indicator.hidden =
            !target || target.block.from === session?.block.from;
        if (!target) return;
        const { view } = this.options;
        const bounds = view.contentDOM.getBoundingClientRect();
        const viewport = markdownDragViewport(view);
        this.indicator.hidden ||=
            target.top < viewport.top || target.top > viewport.bottom;
        this.indicator.style.top = `${target.top}px`;
        this.indicator.style.left = `${bounds.left}px`;
        this.indicator.style.width = `${bounds.width}px`;
    }

    private scrollFrame = (time: number) => {
        this.frame = null;
        const pointer = this.session?.pointer;
        if (!pointer) return;
        const scrolled = scrollMarkdownDrag(
            this.options.view,
            pointer.clientY,
            time - this.previousFrameTime,
        );
        this.previousFrameTime = time;
        this.refreshTarget();
        if (scrolled) this.frame = requestAnimationFrame(this.scrollFrame);
    };

    private drop = (event: DragEvent) => {
        if (!event.dataTransfer?.types.includes(blockDragType)) return;
        event.preventDefault();
        event.stopPropagation();
        const session = this.session;
        const target =
            session && this.canMove()
                ? markdownBlockDropTarget(this.options.view, event)
                : null;
        this.finish();
        if (!session || !target) return;
        if (session.doc !== this.options.view.state.doc) {
            this.options.onNotice(
                'The document changed during the drag. Drag the block again.',
            );
            return;
        }
        try {
            moveMarkdownBlock(
                this.options.view,
                session.block,
                target.block,
                target.placement,
            );
        } catch (error) {
            this.options.onNotice(
                error instanceof Error
                    ? error.message
                    : 'Could not move this block.',
            );
        }
    };

    private dropOutside = (event: DragEvent) => {
        if (!this.options.view.dom.contains(event.target as Node))
            this.finish();
    };

    private cancelWithEscape = (event: KeyboardEvent) => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        event.stopPropagation();
        this.finish();
    };

    private end = () => this.finish();

    private finish() {
        this.session?.element?.classList.remove('editor-block-dragging');
        this.session = null;
        this.indicator.hidden = true;
        if (this.frame !== null) cancelAnimationFrame(this.frame);
        this.frame = null;
        document.removeEventListener('dragover', this.trackPointer, true);
        document.removeEventListener('drop', this.dropOutside, true);
        document.removeEventListener('keydown', this.cancelWithEscape, true);
        window.removeEventListener('blur', this.end);
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
        this.options.handle.removeEventListener('dragstart', this.start);
        this.options.handle.removeEventListener('dragend', this.end);
        this.options.view.dom.removeEventListener(
            'dragover',
            this.overEditor,
            true,
        );
        this.options.view.dom.removeEventListener('drop', this.drop, true);
        this.indicator.remove();
    }
}
