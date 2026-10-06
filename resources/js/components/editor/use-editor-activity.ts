import { useSyncExternalStore } from 'react';
import type { EditorActivityController } from './editor-activity-controller';

export function useEditorActivity(controller: EditorActivityController) {
    return useSyncExternalStore(
        controller.subscribe,
        controller.getSnapshot,
        controller.getSnapshot,
    );
}
