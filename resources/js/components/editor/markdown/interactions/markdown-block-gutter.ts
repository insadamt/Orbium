import {
    EditorView,
    ViewPlugin,
    keymap,
    type ViewUpdate,
} from '@codemirror/view';
import { startCompletion } from '@codemirror/autocomplete';
import { revealRichSource } from '../rich/rich-effects';
import { Prec } from '@codemirror/state';
import { interactionButton, interactionSelect } from './interaction-dom';
import {
    adjacentMarkdownBlock,
    markdownBlockAt,
    markdownBlockPresentation,
    moveMarkdownBlock,
    replaceMarkdownBlock,
    setMarkdownBlockPresentation,
    turnMarkdownBlockInto,
    type MarkdownBlockRange,
} from './markdown-block-actions';

export function markdownBlockGutter(onNotice: (message: string) => void) {
    const gutter = ViewPlugin.fromClass(
        class {
            dom = document.createElement('div');
            panel = document.createElement('div');
            block: MarkdownBlockRange | null = null;
            dragging: {
                block: MarkdownBlockRange;
                doc: EditorView['state']['doc'];
            } | null = null;
            constructor(readonly view: EditorView) {
                this.dom.className =
                    'orbium-markdown-gutter absolute z-30 flex gap-0.5 text-muted-foreground';
                this.dom.hidden = true;
                const add = interactionButton('Add block below', '+', () => {
                    const block = this.block;
                    if (!block) return;
                    if (
                        replaceMarkdownBlock(
                            view,
                            block,
                            `${block.source}\n\n/`,
                            block.source.length + 3,
                        )
                    )
                        startCompletion(view);
                });
                const handle = interactionButton(
                    'Block menu; drag to reorder',
                    '⠿',
                    () => this.openMenu(),
                );
                handle.draggable = true;
                handle.addEventListener('dragstart', (event) => {
                    if (!this.block || !view.state.facet(EditorView.editable)) {
                        event.preventDefault();
                        return;
                    }
                    this.dragging = { block: this.block, doc: view.state.doc };
                    event.dataTransfer?.setData(
                        'application/x-orbium-block',
                        String(this.block.from),
                    );
                    if (event.dataTransfer)
                        event.dataTransfer.effectAllowed = 'move';
                    this.panel.hidden = true;
                });
                handle.addEventListener('dragend', () => {
                    this.dragging = null;
                });
                this.panel.className =
                    'glass-surface absolute top-full left-0 mt-1 flex w-60 flex-col gap-1 rounded-xl border border-border p-2 text-foreground shadow-xl';
                this.panel.hidden = true;
                this.panel.setAttribute('role', 'group');
                this.panel.setAttribute('aria-label', 'Block actions');
                this.dom.append(add, handle, this.panel);
                view.dom.append(this.dom);
                view.dom.addEventListener('pointermove', this.hover);
                view.dom.addEventListener('pointerleave', this.leave);
                view.dom.addEventListener('dragover', this.dragOver);
                view.dom.addEventListener('drop', this.drop);
                document.addEventListener('pointerdown', this.dismiss);
                this.dom.addEventListener('keydown', (event) => {
                    if (event.key === 'Escape') {
                        this.panel.hidden = true;
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
                const coordinates = this.view.coordsAtPos(this.block.from);
                if (!coordinates) return;
                this.dom.style.top = `${coordinates.top - this.view.dom.getBoundingClientRect().top}px`;
                this.dom.style.left = '-48px';
                this.dom.hidden = false;
                this.panel.hidden = true;
                this.openMenu();
                this.panel
                    .querySelector<HTMLElement>('select, button')
                    ?.focus();
            }
            openMenu() {
                if (!this.block) return;
                const presentation = markdownBlockPresentation(
                    this.view,
                    this.block,
                );
                const convert = interactionSelect(
                    'Turn into',
                    [
                        ['choose', 'Turn into…'],
                        ['', 'Text'],
                        ['# ', 'Heading 1'],
                        ['## ', 'Heading 2'],
                        ['### ', 'Heading 3'],
                        ['- ', 'Bullet list'],
                        ['1. ', 'Numbered list'],
                        ['- [ ] ', 'Checklist'],
                        ['> ', 'Quote'],
                        ['> [!NOTE]\n> ', 'Callout'],
                    ],
                    'choose',
                    (prefix) =>
                        this.run((block) =>
                            turnMarkdownBlockInto(this.view, block, prefix),
                        ),
                );
                const direction = interactionSelect(
                    'Block direction',
                    [
                        ['auto', 'Auto direction'],
                        ['ltr', 'Left to right'],
                        ['rtl', 'Right to left'],
                    ],
                    presentation.metadata.dir ?? 'auto',
                    (dir) =>
                        this.run((block) =>
                            setMarkdownBlockPresentation(this.view, block, {
                                dir: dir as 'auto' | 'ltr' | 'rtl',
                            }),
                        ),
                );
                const alignment = interactionSelect(
                    'Text alignment',
                    [
                        ['', 'Default alignment'],
                        ['left', 'Align left'],
                        ['center', 'Align center'],
                        ['right', 'Align right'],
                    ],
                    presentation.metadata.align ?? '',
                    (align) =>
                        this.run((block) =>
                            setMarkdownBlockPresentation(this.view, block, {
                                align: (align || undefined) as
                                    | 'left'
                                    | 'center'
                                    | 'right'
                                    | undefined,
                            }),
                        ),
                );
                this.panel.replaceChildren(convert, direction, alignment);
                const actions: [string, (block: MarkdownBlockRange) => void][] =
                    [
                        [
                            'Select block',
                            (block) => {
                                this.view.dispatch({
                                    selection: {
                                        anchor: block.from,
                                        head: block.to,
                                    },
                                    effects: revealRichSource.of(block.from),
                                });
                                this.view.focus();
                            },
                        ],

                        [
                            'Duplicate',
                            (block) => {
                                replaceMarkdownBlock(
                                    this.view,
                                    block,
                                    `${block.source}\n\n${block.source}`,
                                    block.source.length + 2,
                                );
                            },
                        ],
                        [
                            'Copy Markdown',
                            (block) => {
                                void navigator.clipboard
                                    .writeText(block.source)
                                    .catch(() =>
                                        onNotice(
                                            'Clipboard access failed. Select the block and copy in Source mode.',
                                        ),
                                    );
                            },
                        ],
                        [
                            'Move up',
                            (block) => {
                                const neighbor = adjacentMarkdownBlock(
                                    this.view,
                                    block,
                                    true,
                                );
                                if (neighbor)
                                    moveMarkdownBlock(
                                        this.view,
                                        block,
                                        neighbor,
                                    );
                            },
                        ],
                        [
                            'Move down',
                            (block) => {
                                const neighbor = adjacentMarkdownBlock(
                                    this.view,
                                    block,
                                    false,
                                );
                                if (neighbor)
                                    moveMarkdownBlock(
                                        this.view,
                                        block,
                                        neighbor,
                                    );
                            },
                        ],
                        [
                            'Delete',
                            (block) => {
                                replaceMarkdownBlock(this.view, block, '');
                            },
                        ],
                    ];
                for (const [label, command] of actions)
                    this.panel.append(
                        interactionButton(label, label, () => {
                            this.run(command);
                            this.panel.hidden = true;
                        }),
                    );
                this.panel.hidden = !this.panel.hidden;
            }
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
                const parent = this.view.dom.getBoundingClientRect();
                const coordinates =
                    widget?.getBoundingClientRect() ??
                    this.view.coordsAtPos(this.block.from);
                if (!coordinates) return;
                this.dom.style.top = `${coordinates.top - parent.top}px`;
                this.dom.style.left = '-48px';
                this.dom.hidden = false;
            };
            leave = () => {
                if (this.panel.hidden) this.dom.hidden = true;
            };
            dismiss = (event: PointerEvent) => {
                if (!this.dom.contains(event.target as Node))
                    this.panel.hidden = true;
            };
            dragOver = (event: DragEvent) => {
                if (this.dragging) {
                    event.preventDefault();
                    if (event.dataTransfer)
                        event.dataTransfer.dropEffect = 'move';
                }
            };
            drop = (event: DragEvent) => {
                if (!this.dragging) return;
                event.preventDefault();
                event.stopPropagation();
                const drag = this.dragging;
                this.dragging = null;
                if (drag.doc !== this.view.state.doc) {
                    onNotice(
                        'The document changed during the drag. Drag the block again.',
                    );
                    return;
                }
                const position = this.view.posAtCoords({
                    x: event.clientX,
                    y: event.clientY,
                });
                if (position !== null)
                    moveMarkdownBlock(
                        this.view,
                        drag.block,
                        markdownBlockAt(this.view.state, position),
                    );
            };
            update(update: ViewUpdate) {
                if (
                    update.docChanged ||
                    update.viewportChanged ||
                    !update.state.facet(EditorView.editable)
                ) {
                    this.dom.hidden = true;
                    this.panel.hidden = true;
                    this.block = null;
                }
            }
            destroy() {
                this.view.dom.removeEventListener('pointermove', this.hover);
                this.view.dom.removeEventListener('pointerleave', this.leave);
                this.view.dom.removeEventListener('dragover', this.dragOver);
                this.view.dom.removeEventListener('drop', this.drop);
                document.removeEventListener('pointerdown', this.dismiss);
                this.dom.remove();
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
