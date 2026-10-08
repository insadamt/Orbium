import { StateEffect, StateField } from '@codemirror/state';
import {
    EditorView,
    ViewPlugin,
    showTooltip,
    type Tooltip,
} from '@codemirror/view';
import {
    formatMarkdownSelection,
    inlineFormattingRange,
    setMarkdownInlineMetadata,
    setMarkdownLink,
} from './markdown-inline-format';
import { interactionButton } from './interaction-dom';

const colors = [
    ['Red', 'red'],
    ['Blue', 'blue'],
    ['Green', 'green'],
    ['Cyan', 'teal'],
    ['Magenta', 'pink'],
    ['Yellow in dark mode, violet in light mode', 'purple'],
    ['Orange', 'orange'],
];

function createSelectionToolbar(
    view: EditorView,
    onNotice: (message: string) => void,
) {
    const dom = document.createElement('div');
    dom.className =
        'orbium-selection-toolbar glass-surface flex flex-wrap items-center gap-1 rounded-xl border border-border p-1 shadow-xl';
    dom.setAttribute('role', 'toolbar');
    dom.setAttribute('aria-label', 'Text formatting');
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
    for (const [label, text, delimiter] of [
        ['Bold', 'B', '**'],
        ['Italic', 'I', '*'],
        ['Strike', 'S', '~~'],
        ['Inline code', '</>', '`'],
    ] as const)
        dom.append(
            interactionButton(label, text, () =>
                run(() => formatMarkdownSelection(view, delimiter)),
            ),
        );
    dom.append(
        interactionButton('Underline', 'U', () =>
            run(() => setMarkdownInlineMetadata(view, { underline: true })),
        ),
    );
    dom.append(
        interactionButton('Link', 'Link', () => {
            const destination = window.prompt(
                'Link URL (leave empty to remove a link)',
                'https://',
            );
            if (destination !== null)
                run(() => setMarkdownLink(view, destination.trim() || null));
        }),
    );
    const palette = document.createElement('details');
    palette.className = 'relative';
    const summary = document.createElement('summary');
    summary.textContent = 'Color';
    summary.className =
        'cursor-pointer list-none rounded px-2 py-1.5 text-sm hover:bg-accent';
    summary.setAttribute('aria-label', 'Text color');
    summary.addEventListener('mousedown', (event) => event.preventDefault());
    palette.append(summary);
    const panel = document.createElement('div');
    panel.className =
        'glass-surface absolute top-full right-0 z-50 mt-2 flex w-52 flex-wrap gap-2 rounded-xl border border-border p-3 shadow-xl';
    panel.setAttribute('role', 'group');
    panel.setAttribute('aria-label', 'Text colors');
    for (const [name, color] of colors) {
        const swatch = interactionButton(name, '', () =>
            run(() =>
                setMarkdownInlineMetadata(view, { color: `preset:${color}` }),
            ),
        );
        swatch.className =
            'size-7 rounded-full border border-border focus-visible:outline-2 focus-visible:outline-ring';
        swatch.style.backgroundColor = `var(--editor-text-color-${color})`;
        panel.append(swatch);
    }
    const label = document.createElement('label');
    label.textContent = 'Custom color';
    label.className = 'flex w-full items-center justify-between text-xs';
    const custom = document.createElement('input');
    custom.type = 'color';
    custom.value = '#75a1ff';
    custom.setAttribute('aria-label', 'Choose any text color');
    custom.addEventListener('change', () =>
        run(() =>
            setMarkdownInlineMetadata(view, {
                color: custom.value.toLowerCase(),
            }),
        ),
    );
    label.append(custom);
    panel.append(
        label,
        interactionButton('Default text color', 'Default text color', () =>
            run(() => setMarkdownInlineMetadata(view, { color: null })),
        ),
    );
    palette.append(panel);
    dom.append(palette);
    dom.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            view.focus();
            view.dispatch({
                selection: { anchor: view.state.selection.main.head },
            });
        }
        if (
            !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key) ||
            event.target instanceof HTMLInputElement
        )
            return;
        const controls = [
            ...dom.querySelectorAll<HTMLElement>('button, summary'),
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
    return { dom };
}

export function markdownSelectionToolbar(onNotice: (message: string) => void) {
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
                              create: (view) =>
                                  createSelectionToolbar(view, onNotice),
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
                    const focused = this.view.dom.contains(
                        document.activeElement,
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
    return [field, focus];
}
