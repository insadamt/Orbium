import katex from 'katex';
import { useEffect, useRef, useState } from 'react';
import type { EditorActivityController } from './editor-activity-controller';
import { useEditorActivity } from './use-editor-activity';
import { scheduleEditorIdleWork } from './schedule-editor-idle-work';
import { measureEditorWork } from '@/lib/editor-performance';

export function useMathPreview({
    latex,
    displayMode,
    activated,
    activityController,
}: {
    latex: string;
    displayMode: boolean;
    activated: boolean;
    activityController: EditorActivityController;
}) {
    const { active } = useEditorActivity(activityController);
    const [preview, setPreview] = useState<{ html: string; error: boolean }>({
        html: '',
        error: false,
    });
    const renderedSource = useRef<string | null>(null);
    useEffect(() => {
        if (!active || !activated || renderedSource.current === latex) return;
        return scheduleEditorIdleWork(() => {
            if (!activityController.getSnapshot().active) return;
            const result = measureEditorWork('math.preview', () => {
                try {
                    return {
                        html: katex.renderToString(latex, {
                            displayMode,
                            throwOnError: true,
                            trust: false,
                        }),
                        error: false,
                    };
                } catch {
                    return { html: '', error: true };
                }
            });
            renderedSource.current = latex;
            setPreview(result);
        });
    }, [active, activated, activityController, latex, displayMode]);
    return { active, preview };
}
