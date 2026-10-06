import { useEffect, useRef, useState } from 'react';
import type { EditorActivityController } from './editor-activity-controller';
import { useEditorActivity } from './use-editor-activity';
import { adjustEditorPerformanceCounter } from '@/lib/editor-performance';

export function usePreviewActivation<
    ElementType extends HTMLElement = HTMLDivElement,
>(activityController: EditorActivityController) {
    const { active } = useEditorActivity(activityController);
    const previewContainer = useRef<ElementType>(null);
    const [activated, setActivated] = useState(false);

    useEffect(() => {
        if (activated || !active) return;
        const container = previewContainer.current;
        if (!container || typeof IntersectionObserver === 'undefined') {
            setActivated(true);
            return;
        }
        let disposed = false;
        const observer = new IntersectionObserver(
            (entries) => {
                if (disposed || !activityController.getSnapshot().active)
                    return;
                if (!entries.some((entry) => entry.isIntersecting)) return;
                setActivated(true);
            },
            { rootMargin: '600px' },
        );
        observer.observe(container);
        adjustEditorPerformanceCounter('preview.active-observers', 1);
        return () => {
            disposed = true;
            observer.disconnect();
            adjustEditorPerformanceCounter('preview.active-observers', -1);
        };
    }, [activated, active, activityController]);

    return { previewContainer, activated };
}
