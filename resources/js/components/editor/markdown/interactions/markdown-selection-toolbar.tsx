import { StateEffect, StateField } from '@codemirror/state';
import {
    EditorView,
    ViewPlugin,
    showTooltip,
    getTooltip,
    tooltips,
    type Tooltip,
} from '@codemirror/view';
import {
    formatMarkdownSelection,
    inlineFormattingRange,
    setMarkdownInlineMetadata,
    setMarkdownLink,
} from './markdown-inline-format';
import { createRoot } from 'react-dom/client';
import {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Code2,
    Link2,
} from 'lucide-react';
import { TextColorMenu } from '../../ui/text-color-menu';
import { FormatButton } from '../../ui/format-button';
import { markdownSelectionFormatting } from './markdown-selection-formatting';

const selectionToolbarOwners = new WeakMap<HTMLElement, EditorView>();

export function isSelectionToolbarTarget(
    view: EditorView,
    target: Node,
): boolean {
    const toolbar = (
        target instanceof Element ? target : target.parentElement
    )?.closest<HTMLElement>('.orbium-selection-toolbar');
    return Boolean(toolbar && selectionToolbarOwners.get(toolbar) === view);
}

function createSelectionToolbar(
    view: EditorView,
    onNotice: (message: string) => void,
) {
    const dom = document.createElement('div');
    dom.className =
        'orbium-selection-toolbar orbium-editor-toolbar glass-surface flex items-center gap-1 rounded-xl border border-border p-1 shadow-lg';
    selectionToolbarOwners.set(dom, view);
    dom.setAttribute('role', 'toolbar');
    dom.setAttribute('aria-label', 'Text formatting');
    const root = createRoot(dom);
    const run = (command: () => void) => {
        try {
            onNotice('');
            command();
        } catch (error) {
            onNotice(
                error instanceof Error
                    ? error.message
                    : 'Could not apply formatting.',
            );
        }
    };
    function render() {
        const formatting = markdownSelectionFormatting(view.state);
        root.render(
            <>
                <FormatButton
                    label="Bold"
                    active={formatting.bold}
                    onClick={() =>
                        run(() => formatMarkdownSelection(view, '**'))
                    }
                >
                    <Bold size={16} />
                </FormatButton>
                <FormatButton
                    label="Italic"
                    active={formatting.italic}
                    onClick={() =>
                        run(() => formatMarkdownSelection(view, '*'))
                    }
                >
                    <Italic size={16} />
                </FormatButton>
                <FormatButton
                    label="Underline"
                    active={formatting.underline}
                    onClick={() =>
                        run(() =>
                            setMarkdownInlineMetadata(view, {
                                underline: true,
                            }),
                        )
                    }
                >
                    <Underline size={16} />
                </FormatButton>
                <FormatButton
                    label="Strike"
                    active={formatting.strike}
                    onClick={() =>
                        run(() => formatMarkdownSelection(view, '~~'))
                    }
                >
                    <Strikethrough size={16} />
                </FormatButton>
                <FormatButton
                    label="Inline code"
                    active={formatting.code}
                    onClick={() =>
                        run(() => formatMarkdownSelection(view, '`'))
                    }
                >
                    <Code2 size={16} />
                </FormatButton>
                <FormatButton
                    label="Link"
                    active={formatting.link}
                    onClick={() => {
                        const destination = window.prompt(
                            'Link URL (https://, http:// or mailto:)',
                            formatting.href ?? '',
                        );
                        if (destination !== null)
                            run(() =>
                                setMarkdownLink(
                                    view,
                                    destination.trim() || null,
                                ),
                            );
                    }}
                >
                    <Link2 size={16} />
                </FormatButton>
                <TextColorMenu
                    active
                    currentColor={formatting.color}
                    onOpen={() => {}}
                    onChoose={(color, keepOpen) => {
                        const input = document.activeElement;
                        run(() => setMarkdownInlineMetadata(view, { color }));
                        if (keepOpen && input instanceof HTMLInputElement)
                            input.focus();
                    }}
                />
            </>,
        );
    }
    render();
    dom.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            view.focus();
        }
        if (
            !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key) ||
            event.target instanceof HTMLInputElement
        )
            return;
        const controls = [
            ...dom.querySelectorAll<HTMLElement>('button'),
        ].filter((control) => control.offsetParent !== null);
        const index = controls.indexOf(document.activeElement as HTMLElement);
        const next =
            event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? controls.length - 1
                  : (index +
                        (event.key === 'ArrowRight' ? 1 : -1) +
                        controls.length) %
                    controls.length;
        controls[next]?.focus();
        event.preventDefault();
    });
    return {
        dom,
        update: render,
        destroy: () => {
            selectionToolbarOwners.delete(dom);
            queueMicrotask(() => root.unmount());
        },
    };
}

export function markdownSelectionToolbar(onNotice: (message: string) => void) {
    const createToolbar = (view: EditorView) =>
        createSelectionToolbar(view, onNotice);
    const setFocused = StateEffect.define<boolean>();
    const field = StateField.define<{
        focused: boolean;
        tooltip: Tooltip | null;
    }>({
        create: () => ({ focused: false, tooltip: null }),
        update(previous, transaction) {
            let focused = previous.focused;
            for (const effect of transaction.effects)
                if (effect.is(setFocused)) focused = effect.value;
            if (
                !transaction.docChanged &&
                !transaction.selection &&
                focused === previous.focused &&
                transaction.startState.facet(EditorView.editable) ===
                    transaction.state.facet(EditorView.editable)
            )
                return previous;
            const range = inlineFormattingRange({
                state: transaction.state,
                compositionStarted: false,
            });
            return {
                focused,
                tooltip:
                    focused && range
                        ? {
                              pos: range.from,
                              end: range.to,
                              above: true,
                              create: createToolbar,
                          }
                        : null,
            };
        },
        provide: (source) => showTooltip.from(source, (value) => value.tooltip),
    });
    const focus = ViewPlugin.fromClass(
        class {
            destroyed = false;
            constructor(readonly view: EditorView) {
                this.schedule();
            }
            update() {
                this.schedule();
            }
            schedule() {
                queueMicrotask(() => {
                    if (this.destroyed || !this.view.dom.isConnected) return;
                    const tooltip = this.view.state.field(field).tooltip;
                    const focused =
                        this.view.dom.contains(document.activeElement) ||
                        Boolean(
                            tooltip &&
                            getTooltip(this.view, tooltip)?.dom.contains(
                                document.activeElement,
                            ),
                        );
                    if (this.view.state.field(field).focused !== focused)
                        this.view.dispatch({ effects: setFocused.of(focused) });
                });
            }
            destroy() {
                this.destroyed = true;
            }
        },
    );
    return [field, focus, tooltips({ parent: document.body })];
}
