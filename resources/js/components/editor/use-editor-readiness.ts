import type { Editor } from '@tiptap/core';
import { useEffect } from 'react';
import { markEditorPerformance } from '@/lib/editor-performance';
import type { MermaidPreviewSession } from './mermaid-preview-session';

export function useEditorReadiness(
    editor: Editor | null,
    nodeId: number,
    mermaidSession: MermaidPreviewSession,
) {
    useEffect(() => {
        if (!editor) return;
        markEditorPerformance(`document.${nodeId}.editor-content-mounted`);
        let frame = 0;
        const markInteractive = () => {
            if (editor.isDestroyed) return;
            if (
                !editor.isInitialized ||
                !editor.view.dom.isConnected ||
                !editor.isEditable
            ) {
                frame = requestAnimationFrame(markInteractive);
                return;
            }
            markEditorPerformance(`document.${nodeId}.editor-interactive`);
            mermaidSession.start(editor.view.dom);
        };
        frame = requestAnimationFrame(markInteractive);
        return () => cancelAnimationFrame(frame);
    }, [editor, nodeId, mermaidSession]);

    useEffect(() => () => mermaidSession.destroy(), [mermaidSession]);
}
