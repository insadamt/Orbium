import { router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
    adjustEditorPerformanceCounter,
    measureEditorAsync,
} from '@/lib/editor-performance';
import { type EditorStyles } from './block-style-types';
import {
    compileSavedEditorStyles,
    serializeNormalizedEditorStyles,
} from './saved-editor-style-cache';

export default function EditorStyleRuntime() {
    const { editorStyles, auth } = usePage<{
        editorStyles: EditorStyles | null;
    }>().props;
    const userId = auth.user.id;
    const [styleConfiguration, setStyleConfiguration] = useState(() =>
        serializeNormalizedEditorStyles(editorStyles),
    );

    useEffect(() => {
        adjustEditorPerformanceCounter('editor-styles.active-runtimes', 1);
        adjustEditorPerformanceCounter('editor-styles.runtime-mounts', 1);
        let controller: AbortController | null = null;
        const channel =
            typeof BroadcastChannel === 'undefined'
                ? null
                : new BroadcastChannel(`orbium-editor-styles-${userId}`);
        if (channel)
            adjustEditorPerformanceCounter('editor-styles.active-channels', 1);

        // Cached client visits carry old preferences; only server successes are authoritative.
        const removeServerListener = router.on('success', (event) => {
            const props = event.detail.page.props;
            if (props.auth?.user?.id !== userId || !('editorStyles' in props))
                return;
            controller?.abort();
            setStyleConfiguration(
                serializeNormalizedEditorStyles(
                    props.editorStyles as EditorStyles | null,
                ),
            );
        });

        async function refreshStylePreferences() {
            controller?.abort();
            const refreshController = new AbortController();
            controller = refreshController;
            adjustEditorPerformanceCounter(
                'editor-styles.preferences-refreshes',
                1,
            );
            try {
                await measureEditorAsync(
                    'editor-styles.preferences-refresh',
                    async () => {
                        const response = await fetch(
                            '/settings/editor-styles/preferences',
                            {
                                headers: { Accept: 'application/json' },
                                signal: refreshController.signal,
                            },
                        );
                        if (!response.ok) return;
                        const styles =
                            (await response.json()) as EditorStyles | null;
                        if (!refreshController.signal.aborted)
                            setStyleConfiguration(
                                serializeNormalizedEditorStyles(styles),
                            );
                    },
                );
            } catch {
                // A later server visit or notification retries interrupted preferences.
            }
        }

        if (channel) channel.onmessage = refreshStylePreferences;
        return () => {
            controller?.abort();
            removeServerListener();
            channel?.close();
            if (channel)
                adjustEditorPerformanceCounter(
                    'editor-styles.active-channels',
                    -1,
                );
            adjustEditorPerformanceCounter('editor-styles.active-runtimes', -1);
        };
    }, [userId]);

    const css = compileSavedEditorStyles({ userId, styleConfiguration });
    return <style data-editor-style-runtime>{css}</style>;
}
