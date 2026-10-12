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
import { markdownBlockControlTop } from './markdown-block-drag';
import { MarkdownBlockHandleMotion } from './markdown-block-handle-motion';
import { MarkdownBlockDragController } from './markdown-block-drag-controller';
import { markdownBlockMotion } from './markdown-block-motion';
import {
    adjacentMarkdownBlock,
    markdownBlockAt,
    isStructuralMarkdownSeparator,
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
            dragController: MarkdownBlockDragController;
            block: MarkdownBlockRange | null = null;
            closeMenu: (() => void) | null = null;
            iconRoots: Root[] = [];
            motion = new MarkdownBlockHandleMotion(this.dom);
            hoveredPosition: number | null = null;
            destroyed = false;
            animateNextMove = false;
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
                const handle = document.createElement('button');
                handle.type = 'button';
                handle.setAttribute(
                    'aria-label',
                    'Drag block or open block menu',
                );
                handle.title = 'Drag to reorder · Click for block menu';
                handle.addEventListener('click', () => {
                    if (!this.dragController.suppressHandleClick)
                        this.openMenu();
                });
                add.className =
                    'rounded-md p-1 hover:bg-accent hover:text-foreground';
                handle.className =
                    'cursor-grab rounded-md p-1 hover:bg-accent hover:text-foreground active:cursor-grabbing';
                this.iconRoots = [createRoot(add), createRoot(handle)];
                this.iconRoots[0].render(createElement(Plus, { size: 17 }));
                this.iconRoots[1].render(
                    createElement(GripVertical, { size: 17 }),
                );
                this.dragController = new MarkdownBlockDragController({
                    view,
                    handle,
                    currentBlock: () => this.block,
                    onStart: () => {
                        this.motion.finish();
                        this.dismissMenu();
                    },
                    onNotice,
                });
                this.dom.addEventListener(
                    'pointerdown',
                    () => this.motion.finish(),
                    true,
                );
                this.dom.append(add, handle);
                document.body.append(this.panel);
                this.panel.hidden = true;
                view.dom.append(this.dom);
                view.dom.addEventListener('pointermove', this.hover);
                view.dom.addEventListener('pointerleave', this.leave);
                view.dom.addEventListener('focusin', this.focusChanged);
                this.refreshActiveBlock();
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
                if (
                    isStructuralMarkdownSeparator(
                        this.view.state,
                        this.view.state.selection.main.head,
                    )
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
                this.motion.place({
                    top,
                    visibleTop: null,
                    blockFrom: this.block.from,
                    animate: false,
                });
                this.panel.hidden = true;
                this.openMenu();
                this.panel
                    .querySelector<HTMLElement>('select, button')
                    ?.focus();
            }
            openMenu() {
                if (!this.block) return;
                this.motion.finish();
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
                if (
                    position === null ||
                    isStructuralMarkdownSeparator(this.view.state, position)
                )
                    return;
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
            activeBlockPosition() {
                const focused = document.activeElement;
                const widget =
                    focused instanceof Element &&
                    this.view.dom.contains(focused)
                        ? focused.closest<HTMLElement>('[data-rich-from]')
                        : null;
                return widget
                    ? Number(widget.dataset.richFrom)
                    : this.view.state.selection.main.head;
            }
            refreshCurrentBlock = (animate = false) => {
                this.animateNextMove ||= animate;
                this.view.requestMeasure({
                    key: this,
                    read: () => {
                        if (
                            this.destroyed ||
                            this.dragController.active ||
                            !this.panel.hidden
                        )
                            return undefined;
                        if (!this.view.state.facet(EditorView.editable))
                            return null;
                        const position =
                            this.hoveredPosition ?? this.activeBlockPosition();
                        if (
                            isStructuralMarkdownSeparator(
                                this.view.state,
                                position,
                            )
                        )
                            return undefined;
                        const block = markdownBlockAt(
                            this.view.state,
                            position,
                        );
                        const top = markdownBlockControlTop(
                            this.view,
                            block,
                            this.dom.offsetHeight || 25,
                        );
                        if (top === null) return null;
                        return {
                            block,
                            top,
                            visibleTop: this.motion.measureVisibleTop(
                                this.view.dom.getBoundingClientRect().top,
                                this.view.scaleY,
                            ),
                        };
                    },
                    write: (placement) => {
                        if (
                            this.destroyed ||
                            this.dragController.active ||
                            !this.panel.hidden ||
                            placement === undefined
                        )
                            return;
                        const animateMove = this.animateNextMove;
                        this.animateNextMove = false;
                        if (placement === null) {
                            this.motion.hide();
                            return;
                        }
                        this.block = placement.block;
                        this.motion.place({
                            ...placement,
                            blockFrom: placement.block.from,
                            animate: animateMove,
                        });
                    },
                });
            };
            refreshActiveBlock = () => {
                this.hoveredPosition = null;
                this.refreshCurrentBlock(true);
            };
            focusChanged = (event: FocusEvent) => {
                if (!this.dom.contains(event.target as Node))
                    this.refreshActiveBlock();
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
                this.refreshCurrentBlock();
            };

            hover = (event: PointerEvent) => {
                if (
                    this.dragController.active ||
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
                if (
                    position === null ||
                    isStructuralMarkdownSeparator(this.view.state, position)
                )
                    return;
                const block = markdownBlockAt(this.view.state, position);
                if (this.hoveredPosition === block.from) return;
                this.hoveredPosition = block.from;
                this.refreshCurrentBlock(true);
            };
            leave = () => {
                if (this.panel.hidden) this.refreshActiveBlock();
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
            update(update: ViewUpdate) {
                this.dragController.update(update);
                if (update.docChanged && this.hoveredPosition !== null)
                    this.hoveredPosition = update.changes.mapPos(
                        this.hoveredPosition,
                    );
                if (
                    update.docChanged ||
                    update.viewportChanged ||
                    update.geometryChanged ||
                    !update.state.facet(EditorView.editable)
                ) {
                    if (update.docChanged) this.dismissMenu();
                    this.refreshCurrentBlock();
                }
                if (update.selectionSet || update.focusChanged)
                    this.refreshActiveBlock();
            }
            destroy() {
                this.destroyed = true;
                this.motion.hide();
                this.view.dom.removeEventListener('focusin', this.focusChanged);
                this.view.dom.removeEventListener('pointermove', this.hover);
                this.view.dom.removeEventListener('pointerleave', this.leave);
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
                this.dragController.destroy();
                const roots = this.iconRoots;
                queueMicrotask(() => roots.forEach((root) => root.unmount()));
            }
        },
    );
    return [
        markdownBlockMotion,
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
