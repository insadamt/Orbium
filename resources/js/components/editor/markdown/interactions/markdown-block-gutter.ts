// Summary: Positions block handles and menus in the owning editor, including nested columns; depends on block geometry, drag controls and menu surfaces.
import { EditorView, ViewPlugin, type ViewUpdate } from '@codemirror/view';
import { interactionButton } from './interaction-dom';
import { mountMarkdownBlockMenu } from './markdown-block-menu';
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { GripVertical, Plus } from 'lucide-react';
import { markdownBlockControlTop } from './markdown-block-drag';
import { MarkdownBlockHandleMotion } from './markdown-block-handle-motion';
import { MarkdownBlockDragController } from './markdown-block-drag-controller';
import { markdownBlockMotion } from './markdown-block-motion';
import { markdownBlockKeymap } from './markdown-block-keymap';
import { markdownBlockHoverPosition } from './markdown-block-hover-position';
import {
    markdownBlockAt,
    isStructuralMarkdownSeparator,
    markdownBlockPresentation,
    replaceMarkdownBlock,
    type MarkdownBlockRange,
} from './markdown-block-actions';

export function markdownBlockGutter(
    onNotice: (message: string) => void,
    scope: 'document' | 'column' = 'document',
) {
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
            hoverPointer: { clientX: number; clientY: number } | null = null;
            destroyed = false;
            animateNextMove = false;
            hoverSurface: HTMLElement;
            constructor(readonly view: EditorView) {
                // Column handles listen within their own host; the document
                // handle continues to track the complete columns widget.
                this.hoverSurface =
                    scope === 'column'
                        ? view.dom.parentElement!
                        : (view.dom.closest<HTMLElement>(
                              '.floating-document-island',
                          ) ??
                          view.dom.parentElement ??
                          view.dom);
                this.dom.className =
                    'orbium-markdown-gutter absolute left-0 z-10 flex items-center rounded-lg text-muted-foreground sm:-left-12';
                this.dom.hidden = true;
                this.dom.dataset.blockScope = scope;
                this.dom.setAttribute('data-block-controls', '');
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
                    this.motion.pause,
                    true,
                );
                this.dom.addEventListener('pointerenter', this.motion.pause);
                this.dom.addEventListener('pointerleave', this.releaseControls);
                this.dom.append(add, handle);
                document.body.append(this.panel);
                this.panel.hidden = true;
                view.dom.append(this.dom);
                this.hoverSurface.addEventListener('pointermove', this.hover);
                this.hoverSurface.addEventListener('pointerleave', this.leave);
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
                    (event.target as Element).closest('.cm-editor') !==
                        this.view.dom ||
                    (event.target as Element).closest(
                        'input, textarea, [data-block-controls]',
                    )
                )
                    return;
                const widget = (event.target as Element).closest<HTMLElement>(
                    '[data-rich-from]',
                );
                const position =
                    widget && this.view.contentDOM.contains(widget)
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
                event.stopPropagation();
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
                        ? [
                              ...this.view.dom.querySelectorAll<HTMLElement>(
                                  '[data-rich-from]',
                              ),
                          ].find(
                              (candidate) =>
                                  candidate.closest('.cm-editor') ===
                                      this.view.dom &&
                                  candidate.contains(focused),
                          )
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
                            !this.panel.hidden ||
                            this.dom.matches(':hover, :focus-within')
                        )
                            return undefined;
                        if (!this.view.state.facet(EditorView.editable))
                            return null;
                        const position =
                            (this.hoverPointer &&
                                markdownBlockHoverPosition(
                                    this.view,
                                    this.hoverPointer,
                                )) ??
                            this.activeBlockPosition();
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
                                this.view.dom.getBoundingClientRect().top +
                                    this.view.dom.clientTop * this.view.scaleY,
                                this.view.scaleY,
                            ),
                        };
                    },
                    write: (placement) => {
                        if (
                            this.destroyed ||
                            this.dragController.active ||
                            !this.panel.hidden ||
                            this.dom.matches(':hover, :focus-within') ||
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
                        if (this.hoverPointer)
                            this.hoveredPosition = placement.block.from;
                        this.motion.place({
                            ...placement,
                            blockFrom: placement.block.from,
                            animate: animateMove,
                        });
                    },
                });
            };
            refreshActiveBlock = () => {
                if (
                    this.dragController.active ||
                    !this.panel.hidden ||
                    this.dom.matches(':hover, :focus-within')
                )
                    return;
                this.hoveredPosition = null;
                this.hoverPointer = null;
                this.refreshCurrentBlock(true);
            };
            releaseControls = () => {
                this.motion.resume();
                this.refreshCurrentBlock();
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
                    event.pointerType === 'touch' ||
                    event.buttons !== 0 ||
                    this.dragController.active ||
                    !this.panel.hidden ||
                    this.dom.contains(event.target as Node) ||
                    !this.view.state.facet(EditorView.editable)
                )
                    return;
                this.hoverPointer = {
                    clientX: event.clientX,
                    clientY: event.clientY,
                };
                const position = markdownBlockHoverPosition(this.view, event);
                if (position === null) {
                    if (this.hoveredPosition !== null)
                        this.refreshActiveBlock();
                    return;
                }
                if (isStructuralMarkdownSeparator(this.view.state, position))
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
                if (
                    update.docChanged ||
                    update.viewportChanged ||
                    update.geometryChanged ||
                    !update.state.facet(EditorView.editable)
                ) {
                    if (update.docChanged) {
                        this.dismissMenu();
                        this.motion.hide();
                    }
                    this.refreshCurrentBlock();
                }
                if (
                    update.selectionSet ||
                    (update.focusChanged && this.view.hasFocus)
                )
                    this.refreshActiveBlock();
            }
            destroy() {
                this.destroyed = true;
                this.motion.hide();
                this.view.dom.removeEventListener('focusin', this.focusChanged);
                this.hoverSurface.removeEventListener(
                    'pointermove',
                    this.hover,
                );
                this.hoverSurface.removeEventListener(
                    'pointerleave',
                    this.leave,
                );
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
        markdownBlockKeymap((view) => view.plugin(gutter)?.focusCurrentBlock()),
    ];
}
