import {
    markdownSelectAll,
    orbiumSelectionAppearance,
} from '../markdown-selection';
import {
    Compartment,
    StateEffect,
    StateField,
    type Range,
} from '@codemirror/state';
import { Decoration, EditorView, keymap } from '@codemirror/view';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { createCodeHighlighter } from '../../code-highlighter';
import { scheduleEditorIdleWork } from '../../schedule-editor-idle-work';

const lowlight = createCodeHighlighter();
type HighlightNode = {
    type: string;
    value?: string;
    properties?: Record<string, unknown>;
    children?: HighlightNode[];
};
function codeHighlights(source: string, language: string) {
    const ranges: Range<Decoration>[] = [];
    if (!lowlight.registered(language)) return Decoration.none;
    let position = 0;
    function visit(node: HighlightNode) {
        if (node.type === 'text') {
            position += node.value?.length ?? 0;
            return;
        }
        const start = position;
        for (const child of node.children ?? []) visit(child);
        const classes = node.properties?.className;
        if (Array.isArray(classes) && position > start)
            ranges.push(
                Decoration.mark({ class: classes.map(String).join(' ') }).range(
                    start,
                    position,
                ),
            );
    }
    visit(lowlight.highlight(language, source) as HighlightNode);
    return Decoration.set(ranges, true);
}

export function mountCodeInput({
    host,
    source,
    language,
    isVisible,
    onChange,
}: {
    host: HTMLElement;
    source: string;
    language: string;
    isVisible: () => boolean;
    onChange: (source: string) => void;
}) {
    const replaceHighlights =
        StateEffect.define<ReturnType<typeof Decoration.set>>();
    const highlighting = StateField.define({
        create: () => Decoration.none,
        update(previous, transaction) {
            for (const effect of transaction.effects)
                if (effect.is(replaceHighlights)) return effect.value;
            return previous.map(transaction.changes);
        },
        provide: (field) => EditorView.decorations.from(field),
    });
    const editing = new Compartment();
    let currentLanguage = language;
    let synchronizing = false;
    let destroyed = false;
    let cancelHighlight: (() => void) | undefined;
    const view = new EditorView({
        parent: host,
        doc: source,
        extensions: [
            orbiumSelectionAppearance,
            markdownSelectAll,
            highlighting,
            editing.of(EditorView.editable.of(true)),
            keymap.of([indentWithTab, ...defaultKeymap]),
            EditorView.editorAttributes.of({ class: 'orbium-code-input' }),
            EditorView.contentAttributes.of({
                'aria-label': 'Code source',
                spellcheck: 'false',
                dir: 'ltr',
            }),
            EditorView.theme({
                '&': {
                    height: 'auto',
                    minHeight: '0',
                    fontSize: '0.85rem',
                    backgroundColor: 'transparent',
                },
                '.cm-scroller': {
                    fontFamily: 'var(--font-mono, monospace)',
                    lineHeight: '1.55',
                    overflow: 'auto',
                },
                '.cm-content': { padding: '1rem 0', minHeight: '0' },
                '&.orbium-code-input .cm-line': { padding: '0 1rem' },
                '.cm-gutters': {
                    backgroundColor: 'transparent',
                    color: 'var(--muted-foreground)',
                    border: 'none',
                },
                '&.cm-focused': { outline: 'none' },
                '.cm-cursor': { borderLeftColor: 'var(--foreground)' },
            }),
            EditorView.updateListener.of((update) => {
                if (!update.docChanged) return;
                scheduleHighlight();
                if (!synchronizing) onChange(update.state.doc.toString());
            }),
        ],
    });
    function scheduleHighlight() {
        cancelHighlight?.();
        cancelHighlight = scheduleEditorIdleWork(() => {
            if (destroyed || !view.dom.isConnected || !isVisible()) return;
            let decorations = Decoration.none;
            try {
                decorations = codeHighlights(
                    view.state.doc.toString(),
                    currentLanguage,
                );
            } catch {
                /* Unknown syntax keeps the authored code visible. */
            }
            view.dispatch({ effects: replaceHighlights.of(decorations) });
        });
    }
    scheduleHighlight();
    return {
        focus: () => view.focus(),
        update(next: string, nextLanguage: string, disabled: boolean) {
            const changedLanguage = currentLanguage !== nextLanguage;
            currentLanguage = nextLanguage;
            synchronizing = true;
            try {
                if (view.state.doc.toString() !== next)
                    view.dispatch({
                        changes: {
                            from: 0,
                            to: view.state.doc.length,
                            insert: next,
                        },
                    });
                if (view.state.facet(EditorView.editable) === disabled)
                    view.dispatch({
                        effects: editing.reconfigure(
                            EditorView.editable.of(!disabled),
                        ),
                    });
            } finally {
                synchronizing = false;
            }
            if (changedLanguage || !disabled) scheduleHighlight();
        },
        destroy() {
            destroyed = true;
            cancelHighlight?.();
            view.destroy();
        },
    };
}
