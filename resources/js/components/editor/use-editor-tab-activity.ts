import { useEffect } from 'react';
import { useDocumentTab } from '@/components/navigation/document-tab-context';
import type { MermaidPreviewSession } from './mermaid-preview-session';

export function useEditorTabActivity(session: MermaidPreviewSession) {
    const documentTab = useDocumentTab();
    useEffect(() => {
        session.setActive(documentTab.active);
    }, [session, documentTab.active]);
    return documentTab;
}
