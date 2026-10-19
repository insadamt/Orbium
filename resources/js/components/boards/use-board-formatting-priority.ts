import { useLayoutEffect, type RefObject } from 'react';
import type { Editor } from '@tiptap/core';

export function useBoardFormattingPriority(
    editor: Editor,
    formattingRef: RefObject<HTMLDivElement | null>,
    boardId: number,
) {
    useLayoutEffect(() => {
        const formatting = formattingRef.current;
        if (!formatting) return;
        let blockToolbar: HTMLElement | null = null;
        const updatePriority = () => {
            //
            // Tiptap can attach its editor DOM after child layout effects; the Board's mounted formatting slot is the stable owner.
            //
            blockToolbar =
                document
                    .getElementById(`board-formatting-${boardId}`)
                    ?.closest<HTMLElement>('.board-selection-tools') ?? null;
            if (!blockToolbar) return;
            blockToolbar.dataset.textFormattingActive = String(
                !editor.state.selection.empty || !formatting.hidden,
            );
        };
        const observer = new MutationObserver(updatePriority);
        observer.observe(formatting, {
            attributes: true,
            attributeFilter: ['hidden'],
        });
        editor.on('transaction', updatePriority);
        updatePriority();
        return () => {
            observer.disconnect();
            editor.off('transaction', updatePriority);
            if (blockToolbar) delete blockToolbar.dataset.textFormattingActive;
        };
    }, [editor, formattingRef, boardId]);
}
