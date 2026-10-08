import {
    EditorView,
    ViewPlugin,
    keymap,
    type ViewUpdate,
} from '@codemirror/view';
import { revealRichSource } from '../rich/rich-effects';
import { Prec } from '@codemirror/state';
import { interactionButton } from './interaction-dom';
import { mountMarkdownBlockMenu } from './markdown-block-menu';
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { GripVertical, Plus } from 'lucide-react';
import {
    markdownBlockDropTarget,
    markdownBlockElement,
    markdownBlockControlTop,
    showMarkdownBlockDragPreview,
} from './markdown-block-drag';
import {
    adjacentMarkdownBlock,
    markdownBlockAt,
    markdownBlockPresentation,
    moveMarkdownBlock,
    replaceMarkdownBlock,
    type MarkdownBlockRange,
} from './markdown-block-actions';

export function markdownBlockGutter(onNotice: (message: string) => void) {
    const gutter = ViewPlugin.fromClass(
        class {
            dom = document.createElement('div');
            panel = document.createElement('div');
            dropIndicator = document.createElement('div');
            draggedElement: HTMLElement | null = null;
            block: MarkdownBlockRange | null = null;
            closeMenu: (() => void) | null = null;
            iconRoots: Root[] = [];
            dragging: {
                block: MarkdownBlockRange;
                doc: EditorView['state']['doc'];
            } | null = null;
            constructor(readonly view: EditorView) {
                this.dom.className =
                    'orbium-markdown-gutter absolute left-0 z-10 flex items-center rounded-lg text-muted-foreground sm:-left-12';
                this.dom.hidden = true;
                const add = interactionButton('Add block below', '', () => {
                    const block = this.block;
                    if (!block) return;
                    if (
                        replaceMarkdownBlock(
                            view,
                            block,
                            `${block.source}\n\n`,
                            block.source.length + 2,
                        )
                    )
                        this.dismissMenu();
                });
                const handle = interactionButton(
                    'Drag block or open block menu',
                    '',
                    () => this.openMenu(),
                );
                add.className =
                    'rounded-md p-1 hover:bg-accent hover:text-foreground';
                handle.className =
                    'cursor-grab rounded-md p-1 hover:bg-accent hover:text-foreground active:cursor-grabbing';
                this.iconRoots = [createRoot(add), createRoot(handle)];
                this.iconRoots[0].render(createElement(Plus, { size: 17 }));
                this.iconRoots[1].render(
                    createElement(GripVertical, { size: 17 }),
                );
                handle.draggable = true;
                handle.addEventListener('dragstart', (event) => {
                    if (!this.block || !view.state.facet(EditorView.editable)) {
                        event.preventDefault();
                        return;
                    }
                    this.dragging = { block: this.block, doc: view.state.doc };
                    this.draggedElement = markdownBlockElement(
                        view,
                        this.block,
                    );
                    this.draggedElement?.classList.add('editor-block-dragging');
                    showMarkdownBlockDragPreview(event, this.block);
                    event.dataTransfer?.setData(
                        'application/x-orbium-block',
                        String(this.block.from),
                    );
                    if (event.dataTransfer)
                        event.dataTransfer.effectAllowed = 'move';
                    this.dismissMenu();
                });
                handle.addEventListener('dragend', () => {
                    this.dragging = null;
                    this.finishDrag();
                });
                this.dom.append(add, handle);
                document.body.append(this.panel);
                this.panel.hidden = true;
                view.dom.append(this.dom);
                this.dropIndicator.className =
                    'pointer-events-none absolute right-0 left-0 z-10 border-t-2 border-foreground/60';
                this.dropIndicator.hidden = true;
                view.dom.append(this.dropIndicator);
                view.dom.addEventListener('pointermove', this.hover);
                view.dom.addEventListener('pointerleave', this.leave);
                view.dom.addEventListener('dragover', this.dragOver);
                view.dom.addEventListener('drop', this.drop);
                view.dom.addEventListener('contextmenu', this.contextMenu);
                window.addEventListener('scroll', this.viewportChanged, true);
                window.addEventListener('resize', this.viewportChanged);
                document.addEventListener('pointerdown', this.dismiss);
                this.dom.addEventListener('keydown', (event) => {
                    if (event.key === 'Escape') {
                        this.dismissMenu();
                        view.focus();
                    }
                });
            }
            run = (command: (block: MarkdownBlockRange) => void) => {
                if (!this.block) return;
                try {
                    onNotice('');
                    command(this.block);
                } catch (error) {
                    onNotice(
                        error instanceof Error
                            ? error.message
                            : 'Could not edit this block.',
                    );
                }
            };
            focusCurrentBlock() {
                if (
                    !this.view.state.facet(EditorView.editable) ||
                    this.view.compositionStarted
                )
                    return;
                this.block = markdownBlockAt(
                    this.view.state,
                    this.view.state.selection.main.head,
                );
                const top = markdownBlockControlTop(
                    this.view,
                    this.block,
                    this.dom.offsetHeight || 25,
                );
                if (top === null) return;
                this.dom.style.top = `${top}px`;

                this.dom.hidden = false;
                this.panel.hidden = true;
                this.openMenu();
                this.panel
                    .querySelector<HTMLElement>('select, button')
                    ?.focus();
            }
            openMenu() {
                if (!this.block) return;
                if (this.closeMenu) {
                    this.dismissMenu();
                    return;
                }
                const bounds = this.dom.getBoundingClientRect();
                this.panel.hidden = false;
                this.closeMenu = mountMarkdownBlockMenu({
                    view: this.view,
                    block: this.block,
                    host: this.panel,
                    anchor: {
                        x: bounds.right + 8,
                        y: bounds.bottom + 4,
                        direction: this.blockDirection(),
                    },
                    onNotice,
                    onClose: () => this.dismissMenu(),
                });
            }
            blockDirection(): 'ltr' | 'rtl' {
                const presentation = markdownBlockPresentation(
                    this.view,
                    this.block!,
                );
                if (presentation.metadata.dir === 'rtl') return 'rtl';
                if (presentation.metadata.dir === 'ltr') return 'ltr';
                return getComputedStyle(
                    this.view.domAtPos(this.block!.from).node.parentElement ??
                        this.view.dom,
                ).direction === 'rtl'
                    ? 'rtl'
                    : 'ltr';
            }
            dismissMenu = () => {
                this.closeMenu?.();
                this.closeMenu = null;
                this.panel.hidden = true;
            };
            contextMenu = (event: MouseEvent) => {
                if (
                    !this.view.state.facet(EditorView.editable) ||
                    (event.target as Element).closest(
                        'input, textarea, [data-block-controls]',
                    )
                )
                    return;
                const widget = (event.target as Element).closest<HTMLElement>(
                    '[data-rich-from]',
                );
                const position = widget
                    ? Number(widget.dataset.richFrom)
                    : this.view.posAtCoords({
                          x: event.clientX,
                          y: event.clientY,
                      });
                if (position === null) return;
                event.preventDefault();
                this.dismissMenu();
                this.block = markdownBlockAt(this.view.state, position);
                this.panel.hidden = false;
                this.closeMenu = mountMarkdownBlockMenu({
                    view: this.view,
                    block: this.block,
                    host: this.panel,
                    anchor: {
                        x: event.clientX,
                        y: event.clientY,
                        direction: this.blockDirection(),
                    },
                    onNotice,
                    onClose: () => this.dismissMenu(),
                });
            };
            viewportChanged = (event: Event) => {
                if (
                    event.target instanceof Element &&
                    event.target.closest(
                        '[data-block-context-menu], .block-context-select-content',
                    )
                )
                    return;
                this.dismissMenu();
                this.dom.hidden = true;
                this.block = null;
            };

            hover = (event: PointerEvent) => {
                if (
                    !this.panel.hidden ||
                    this.dom.contains(event.target as Node) ||
                    !this.view.state.facet(EditorView.editable)
                )
                    return;
                const widget = (event.target as Element).closest<HTMLElement>(
                    '[data-rich-from]',
                );
                const position = widget
                    ? Number(widget.dataset.richFrom)
                    : this.view.posAtCoords({
                          x: event.clientX,
                          y: event.clientY,
                      });
                if (position === null) return;
                this.block = markdownBlockAt(this.view.state, position);
                const top = markdownBlockControlTop(
                    this.view,
                    this.block,
                    this.dom.offsetHeight || 25,
                );
                if (top === null) return;
                this.dom.style.top = `${top}px`;

                this.dom.hidden = false;
            };
            leave = () => {
                if (this.panel.hidden) this.dom.hidden = true;
            };
            dismiss = (event: PointerEvent) => {
                if (
                    !this.dom.contains(event.target as Node) &&
                    !(
                        event.target instanceof Element &&
                        event.target.closest(
                            '[data-block-context-menu], .block-context-select-content',
                        )
                    )
                )
                    this.dismissMenu();
            };
            dragOver = (event: DragEvent) => {
                if (this.dragging) {
                    event.preventDefault();
                    if (event.dataTransfer)
                        event.dataTransfer.dropEffect = 'move';
                    const target = markdownBlockDropTarget(this.view, event);
                    this.dropIndicator.hidden =
                        !target ||
                        target.block.from === this.dragging.block.from;
                    if (target)
                        this.dropIndicator.style.top = `${target.top}px`;
                }
            };
            finishDrag() {
                this.draggedElement?.classList.remove('editor-block-dragging');
                this.draggedElement = null;
                this.dropIndicator.hidden = true;
            }
            drop = (event: DragEvent) => {
                if (!this.dragging) return;
                event.preventDefault();
                event.stopPropagation();
                const drag = this.dragging;
                this.dragging = null;
                this.finishDrag();
                if (drag.doc !== this.view.state.doc) {
                    onNotice(
                        'The document changed during the drag. Drag the block again.',
                    );
                    return;
                }
                const target = markdownBlockDropTarget(this.view, event);
                if (target)
                    moveMarkdownBlock(
                        this.view,
                        drag.block,
                        target.block,
                        target.placement,
                    );
            };
            update(update: ViewUpdate) {
                if (
                    update.docChanged ||
                    update.viewportChanged ||
                    !update.state.facet(EditorView.editable)
                ) {
                    this.dom.hidden = true;
                    this.dismissMenu();
                    this.block = null;
                }
            }
            destroy() {
                this.view.dom.removeEventListener('pointermove', this.hover);
                this.view.dom.removeEventListener('pointerleave', this.leave);
                this.view.dom.removeEventListener('dragover', this.dragOver);
                this.view.dom.removeEventListener('drop', this.drop);
                this.view.dom.removeEventListener(
                    'contextmenu',
                    this.contextMenu,
                );
                window.removeEventListener(
                    'scroll',
                    this.viewportChanged,
                    true,
                );
                window.removeEventListener('resize', this.viewportChanged);
                this.dismissMenu();
                this.panel.remove();
                document.removeEventListener('pointerdown', this.dismiss);
                this.dom.remove();
                this.finishDrag();
                this.dropIndicator.remove();
                const roots = this.iconRoots;
                queueMicrotask(() => roots.forEach((root) => root.unmount()));
            }
        },
    );
    return [
        gutter,
        Prec.high(
            keymap.of([
                {
                    key: 'Mod-Shift-m',
                    run(view) {
                        view.plugin(gutter)?.focusCurrentBlock();
                        return true;
                    },
                },
                ...(['ArrowUp', 'ArrowDown'] as const).map((key) => ({
                    key: `Alt-Shift-${key}`,
                    run(view: EditorView) {
                        const block = markdownBlockAt(
                            view.state,
                            view.state.selection.main.head,
                        );
                        const neighbor = adjacentMarkdownBlock(
                            view,
                            block,
                            key === 'ArrowUp',
                        );
                        if (neighbor) moveMarkdownBlock(view, block, neighbor);
                        return true;
                    },
                })),
                {
                    key: 'Mod-Shift-a',
                    run(view) {
                        const block = markdownBlockAt(
                            view.state,
                            view.state.selection.main.head,
                        );
                        view.dispatch({
                            selection: { anchor: block.from, head: block.to },
                            effects: revealRichSource.of(block.from),
                        });
                        return true;
                    },
                },
            ]),
        ),
    ];
}
