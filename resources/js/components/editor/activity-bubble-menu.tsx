import type { Editor } from '@tiptap/core';
import { BubbleMenuView } from '@tiptap/extension-bubble-menu';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { EditorActivityController } from './editor-activity-controller';

export function ActivityBubbleMenu({
    editor,
    activityController,
    shouldShow,
    children,
}: {
    editor: Editor;
    activityController: EditorActivityController;
    shouldShow: () => boolean;
    children: ReactNode;
}) {
    const [element] = useState(() => document.createElement('div'));
    const [pluginKey] = useState(() => new PluginKey('orbiumSelectionToolbar'));

    useEffect(() => {
        element.className =
            'glass-surface flex items-center gap-1 rounded-xl border border-border p-1 shadow-lg';
        element.style.visibility = 'hidden';
        element.style.position = 'absolute';
        const plugin = new Plugin({
            key: pluginKey,
            view: (view) => {
                let menu: BubbleMenuView | undefined;
                let disposed = false;
                const suspend = () => {
                    menu?.destroy();
                    menu = undefined;
                };
                const updateActivity = () => {
                    if (disposed || !activityController.getSnapshot().active) {
                        suspend();
                        return;
                    }
                    if (menu) return;
                    // Keep the plugin registered; only its optional floating UI lifecycle pauses.
                    let current = true;
                    menu = new BubbleMenuView({
                        editor,
                        element,
                        view,
                        pluginKey,
                        shouldShow: () =>
                            current &&
                            activityController.getSnapshot().active &&
                            shouldShow(),
                        options: {
                            onDestroy: () => {
                                current = false;
                            },
                        },
                    });
                };
                const unsubscribe =
                    activityController.subscribe(updateActivity);
                updateActivity();
                return {
                    update: (nextView, previousState) => {
                        if (activityController.getSnapshot().active)
                            menu?.update(nextView, previousState);
                    },
                    destroy: () => {
                        disposed = true;
                        unsubscribe();
                        suspend();
                    },
                };
            },
        });
        editor.registerPlugin(plugin);
        return () => {
            if (!editor.isDestroyed) editor.unregisterPlugin(pluginKey);
            element.remove();
        };
    }, [editor, element, pluginKey, activityController, shouldShow]);

    return createPortal(children, element);
}
