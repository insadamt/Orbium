import { syntaxTree } from '@codemirror/language';
import { getSearchQuery } from '@codemirror/search';
import {
    Decoration,
    EditorView,
    ViewPlugin,
    type ViewUpdate,
} from '@codemirror/view';
import { measureEditorWork } from '@/lib/editor-performance';
import type { MarkdownLinkContext } from './markdown-link-preview';
import { buildMarkdownPreview } from './build-markdown-preview';

export function markdownLivePreview(context: MarkdownLinkContext) {
    return ViewPlugin.fromClass(
        class {
            decorations;
            atomicRanges;
            constructor(view: EditorView) {
                const preview = measureEditorWork(
                    'codemirror.preview.decorations',
                    () => buildMarkdownPreview(view, context),
                );
                this.decorations = preview.decorations;
                this.atomicRanges = preview.atomicRanges;
            }
            update(update: ViewUpdate) {
                if (
                    !(
                        update.docChanged ||
                        update.selectionSet ||
                        update.viewportChanged ||
                        update.focusChanged ||
                        getSearchQuery(update.startState).search !==
                            getSearchQuery(update.state).search ||
                        syntaxTree(update.startState) !==
                            syntaxTree(update.state) ||
                        update.startState.facet(EditorView.editable) !==
                            update.state.facet(EditorView.editable)
                    )
                )
                    return;
                const preview = measureEditorWork(
                    'codemirror.preview.decorations',
                    () => buildMarkdownPreview(update.view, context),
                );
                this.decorations = preview.decorations;
                this.atomicRanges = preview.atomicRanges;
            }
        },
        {
            decorations: (plugin) => plugin.decorations,
            provide: (plugin) =>
                EditorView.atomicRanges.of(
                    (view) =>
                        view.plugin(plugin)?.atomicRanges ?? Decoration.none,
                ),
        },
    );
}
