import { Prec, StateEffect, StateField } from '@codemirror/state';
import {
    EditorView,
    keymap,
    showTooltip,
    type Tooltip,
} from '@codemirror/view';
import { createRoot } from 'react-dom/client';
import {
    markdownBlockAt,
    markdownBlockPresentation,
    setMarkdownBlockPresentation,
    type MarkdownBlockRange,
} from './markdown-block-actions';
import { MarkdownDividerControls } from './markdown-divider-controls';

export function markdownDividerToolbar(onNotice: (message: string) => void) {
    const keepDividerToolbarOpen = StateEffect.define<boolean>();
    const setDividerToolbar = StateEffect.define<MarkdownBlockRange | null>();
    function closeToolbar(view: EditorView) {
        view.dispatch({ effects: setDividerToolbar.of(null) });
        view.focus();
    }
    function createToolbar(view: EditorView, block: MarkdownBlockRange) {
        const dom = document.createElement('div');
        dom.className =
            'orbium-divider-toolbar orbium-editor-toolbar glass-surface rounded-xl border border-border text-foreground shadow-lg';
        dom.setAttribute('role', 'toolbar');
        dom.setAttribute('aria-label', 'Divider formatting');
        const root = createRoot(dom);
        let currentBlock = block;
        function renderControls() {
            const presentation = markdownBlockPresentation(view, currentBlock);
            root.render(
                <MarkdownDividerControls
                    metadata={presentation.metadata}
                    onClose={() => closeToolbar(view)}
                    onChange={(patch) => {
                        try {
                            onNotice('');
                            const changed = setMarkdownBlockPresentation(
                                view,
                                currentBlock,
                                patch,
                                {
                                    effects: [keepDividerToolbarOpen.of(true)],
                                    focusEditor: false,
                                    scrollIntoView: false,
                                },
                            );
                            if (!changed) return;
                            currentBlock = markdownBlockAt(
                                view.state,
                                currentBlock.from,
                            );
                            renderControls();
                        } catch (error) {
                            onNotice(
                                error instanceof Error
                                    ? error.message
                                    : 'Could not style this divider.',
                            );
                        }
                    }}
                />,
            );
        }
        renderControls();
        function dismissOutside(event: PointerEvent) {
            const target = event.target;
            if (
                !(target instanceof Element) ||
                dom.contains(target) ||
                target.closest('.divider-toolbar-select-content')
            )
                return;
            view.dispatch({ effects: setDividerToolbar.of(null) });
        }
        dom.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                closeToolbar(view);
            }
        });
        return {
            dom,
            mount() {
                document.addEventListener('pointerdown', dismissOutside, true);
                requestAnimationFrame(() => {
                    if (dom.isConnected)
                        dom.querySelector<HTMLElement>(
                            'input[type="color"]',
                        )?.focus({
                            preventScroll: true,
                        });
                });
            },
            destroy() {
                document.removeEventListener(
                    'pointerdown',
                    dismissOutside,
                    true,
                );
                queueMicrotask(() => root.unmount());
            },
        };
    }
    const field = StateField.define<Tooltip | null>({
        create: () => null,
        update(previous, transaction) {
            const applyingAppearance = transaction.effects.some(
                (effect) => effect.is(keepDividerToolbarOpen) && effect.value,
            );
            let tooltip =
                (!applyingAppearance &&
                    (transaction.docChanged || transaction.selection)) ||
                !transaction.state.facet(EditorView.editable)
                    ? null
                    : previous;
            for (const effect of transaction.effects) {
                if (!effect.is(setDividerToolbar)) continue;
                const block = effect.value;
                tooltip =
                    block && transaction.state.facet(EditorView.editable)
                        ? {
                              pos: block.from,
                              above: true,
                              create: (view) => createToolbar(view, block),
                          }
                        : null;
            }
            return tooltip;
        },
        provide: (source) => showTooltip.from(source),
    });
    function dividerBlockAt(view: EditorView, position: number) {
        if (!view.state.facet(EditorView.editable) || view.compositionStarted)
            return null;
        const block = markdownBlockAt(view.state, position);
        return markdownBlockPresentation(view, block).name === 'HorizontalRule'
            ? block
            : null;
    }
    function clickedDivider(event: MouseEvent, view: EditorView) {
        const target =
            event.target instanceof Element
                ? event.target.closest('.cm-md-divider')
                : null;
        if (!target || target.closest('.cm-editor') !== view.dom) return null;
        return dividerBlockAt(view, view.posAtDOM(target));
    }
    function openToolbar(view: EditorView, block: MarkdownBlockRange) {
        view.dispatch({
            selection: { anchor: block.from },
            effects: setDividerToolbar.of(block),
        });
        return true;
    }
    return [
        field,
        Prec.highest(
            EditorView.domEventHandlers({
                mousedown(event, view) {
                    if (event.button !== 0 || !clickedDivider(event, view))
                        return false;
                    // Preserve the rule widget until the second click instead of selecting its Markdown markers.
                    event.preventDefault();
                    return true;
                },
                dblclick(event, view) {
                    const block = clickedDivider(event, view);
                    if (!block || event.button !== 0) return false;
                    event.preventDefault();
                    return openToolbar(view, block);
                },
            }),
        ),
        keymap.of([
            {
                key: 'Alt-Enter',
                run(view) {
                    const block = dividerBlockAt(
                        view,
                        view.state.selection.main.head,
                    );
                    return block ? openToolbar(view, block) : false;
                },
            },
        ]),
    ];
}
