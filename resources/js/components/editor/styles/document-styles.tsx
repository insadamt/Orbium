import { usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { normalizeEditorStyles, type EditorStyles } from './block-style-types';
import { compileEditorStyles } from './compile-editor-styles';

export default function DocumentStyles() {
    const { editorStyles, auth } = usePage<{
        editorStyles: EditorStyles | null;
    }>().props;
    const [currentStyles, setCurrentStyles] = useState(editorStyles);
    useEffect(() => {
        setCurrentStyles(editorStyles);
    }, [editorStyles]);
    useEffect(() => {
        if (typeof BroadcastChannel === 'undefined') return;
        const channel = new BroadcastChannel(
            `orbium-editor-styles-${auth.user.id}`,
        );
        let controller: AbortController | null = null;
        channel.onmessage = async () => {
            controller?.abort();
            controller = new AbortController();
            try {
                const response = await fetch(
                    '/settings/editor-styles/preferences',
                    {
                        headers: { Accept: 'application/json' },
                        signal: controller.signal,
                    },
                );
                if (response.ok)
                    setCurrentStyles(
                        (await response.json()) as EditorStyles | null,
                    );
            } catch {
                /* A later navigation reloads saved preferences if this request is interrupted. */
            }
        };
        return () => {
            controller?.abort();
            channel.close();
        };
    }, [auth.user.id]);
    const css = useMemo(() => {
        const styles = normalizeEditorStyles(currentStyles);
        if (!styles.enabled) return '';
        try {
            return compileEditorStyles(styles, '[data-document-styles]');
        } catch {
            return '';
        }
    }, [currentStyles]);
    return css ? <style>{css}</style> : null;
}
