import { useEffect, useLayoutEffect, useState } from 'react';
import { useDocumentTab } from '@/components/navigation/document-tab-context';
import type { MermaidPreviewSession } from './mermaid-preview-session';
import { EditorActivityController } from './editor-activity-controller';

export function useEditorTabActivity(session: MermaidPreviewSession) {
    const documentTab = useDocumentTab();
    const [activityController] = useState(
        () => new EditorActivityController(documentTab),
    );

    useLayoutEffect(() => {
        activityController.mount();
        return () => activityController.dispose();
    }, [activityController]);

    useLayoutEffect(() => {
        activityController.setActivity({
            active: documentTab.active,
            visible: documentTab.visible,
        });
    }, [activityController, documentTab.active, documentTab.visible]);

    useEffect(() => {
        let previousActive: boolean | undefined;
        const updateMermaidActivity = () => {
            const { active } = activityController.getSnapshot();
            if (active === previousActive) return;
            previousActive = active;
            session.setActive(active);
        };
        updateMermaidActivity();
        return activityController.subscribe(updateMermaidActivity);
    }, [session, activityController]);
    return { ...documentTab, activityController };
}
