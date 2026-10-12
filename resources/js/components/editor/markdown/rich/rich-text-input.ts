import {
    markdownSelectAll,
    orbiumSelectionAppearance,
} from '../markdown-selection';
import { Compartment, EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { orbiumMarkdownDialect } from '../dialect/markdown-dialect';
import { markdownLivePreview } from '../preview/markdown-live-preview';
import { markdownPreviewTheme } from '../preview/markdown-preview-theme';
import { markdownWritingCommands } from '../preview/markdown-writing-commands';
import { markdownTypingShortcuts } from '../markdown-typing-commands';
import { markdownDividerToolbar } from '../interactions/markdown-divider-toolbar';
import {
    isSelectionToolbarTarget,
    markdownSelectionToolbar,
} from '../interactions/markdown-selection-toolbar';
import type { RichContext } from './rich-model';

export function mountRichTextInput({
    host,
    source,
    context,
    label,
    onChange,
    onNotice,
}: {
    host: HTMLElement;
    source: string;
    context: RichContext;
    label: string;
    onChange: (source: string) => void;
    onNotice: (message: string) => void;
}) {
    let synchronizing = false;
    let destroyed = false;
    let pendingUpdate: { source: string; disabled: boolean } | null = null;
    const editing = new Compartment();
    const view = new EditorView({
        parent: host,
        state: EditorState.create({
            doc: source,
            extensions: [
                orbiumSelectionAppearance,
                markdownSelectAll,
                markdown({
                    base: markdownLanguage,
                    extensions: [orbiumMarkdownDialect],
                }),
                markdownLivePreview(context),
                markdownPreviewTheme,
                markdownWritingCommands,
                markdownTypingShortcuts,
                markdownSelectionToolbar(onNotice),
                markdownDividerToolbar(onNotice),
                EditorView.lineWrapping,
                editing.of(EditorView.editable.of(true)),
                EditorView.contentAttributes.of({ 'aria-label': label }),
                EditorView.editorAttributes.of({
                    class: 'orbium-rich-text-input',
                }),
                EditorView.theme({
                    '&': { minHeight: '0', fontSize: 'inherit' },
                    '.cm-content': { minHeight: '1.75em' },
                    '.cm-scroller': { overflow: 'visible' },
                }),
                keymap.of(defaultKeymap),
                EditorView.updateListener.of((update) => {
                    if (update.docChanged && !synchronizing)
                        onChange(update.state.doc.toString());
                }),
            ],
        }),
    });
    return {
        view,
        focus: () => view.focus(),
        containsFormattingTarget: (target: Node) =>
            isSelectionToolbarTarget(view, target),
        update(next: string, disabled: boolean) {
            pendingUpdate = { source: next, disabled };
            // Parent serialization can normalize the cell during this editor's update listener.
            queueMicrotask(() => {
                const pending = pendingUpdate;
                if (destroyed || !pending) return;
                pendingUpdate = null;
                const { source: next, disabled } = pending;
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
            });
        },
        destroy() {
            destroyed = true;
            view.destroy();
        },
    };
}
