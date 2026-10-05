import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import {
    markEditorPerformance,
    editorProfilingEnabled,
    recordEditorDuration,
} from '@/lib/editor-performance';

export function createEditorPerformanceExtension(nodeId: number) {
    let constructionStarted = 0;
    let created = false;
    return Extension.create({
        name: 'orbiumEditorPerformance',
        onBeforeCreate() {
            constructionStarted = performance.now();
            markEditorPerformance(
                `document.${nodeId}.editor-construction-started`,
            );
        },
        addProseMirrorPlugins() {
            if (!editorProfilingEnabled) return [];
            return [
                new Plugin({
                    view: () => {
                        if (created) return {};
                        created = true;
                        markEditorPerformance(
                            `document.${nodeId}.prosemirror-view-created`,
                        );
                        recordEditorDuration(
                            'editor.prosemirror-construction',
                            constructionStarted,
                        );
                        return {};
                    },
                }),
            ];
        },
    });
}
