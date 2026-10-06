import type { Editor } from '@tiptap/core';
import { useEffect } from 'react';

export function useEditorTabShortcuts(
    editor: Editor | null,
    saveNow: () => void,
    active: boolean,
    openSearch: () => void,
) {
    useEffect(() => {
        if (!active) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (!editor || !(event.ctrlKey || event.metaKey)) return;
            if (event.key.toLowerCase() === 's') {
                event.preventDefault();
                saveNow();
            }
            if (event.key.toLowerCase() === 'f') {
                event.preventDefault();
                openSearch();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [editor, saveNow, active, openSearch]);
}
