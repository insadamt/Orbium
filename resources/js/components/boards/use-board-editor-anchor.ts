import { useLayoutEffect, useRef } from 'react';
import type { Editor } from '@tiptap/core';

export function useBoardEditorAnchor(
    editor: Editor,
    mode: 'selection' | 'caret',
) {
    const surface = useRef<HTMLDivElement>(null);
    useLayoutEffect(() => {
        const element = surface.current;
        if (!element || editor.isDestroyed) return;
        let frame: number | undefined;
        const position = () => {
            frame = undefined;
            if (editor.isDestroyed || !editor.view.dom.isConnected) return;
            const { from, to, empty } = editor.state.selection;
            if (mode === 'selection' && empty) {
                element.hidden = true;
                return;
            }
            const start = editor.view.coordsAtPos(from);
            const end = editor.view.coordsAtPos(to);
            const canvas = editor.view.dom
                .closest('.board-canvas')
                ?.getBoundingClientRect();
            const viewport = window.visualViewport;
            const leftEdge = viewport?.offsetLeft ?? 0;
            const topEdge = viewport?.offsetTop ?? 0;
            const width = viewport?.width ?? window.innerWidth;
            const height = viewport?.height ?? window.innerHeight;
            const anchorTop = mode === 'caret' ? end.bottom : start.top;
            element.hidden = Boolean(
                canvas &&
                (anchorTop < canvas.top ||
                    anchorTop > canvas.bottom ||
                    end.left < canvas.left ||
                    start.left > canvas.right),
            );
            if (element.hidden) return;
            const left =
                mode === 'caret'
                    ? end.left
                    : (start.left + end.right) / 2 - element.offsetWidth / 2;
            const above = start.top - element.offsetHeight - 10;
            const top =
                mode === 'selection' && above >= topEdge + 12
                    ? above
                    : end.bottom + 10;
            element.style.left = `${Math.max(leftEdge + 12, Math.min(left, leftEdge + width - element.offsetWidth - 12))}px`;
            element.style.top = `${Math.max(topEdge + 12, Math.min(top, topEdge + height - element.offsetHeight - 12))}px`;
        };
        const schedule = () => {
            if (frame === undefined) frame = requestAnimationFrame(position);
        };
        editor.on('transaction', schedule);
        window.addEventListener('resize', schedule);
        window.addEventListener('scroll', schedule, true);
        window.visualViewport?.addEventListener('resize', schedule);
        window.visualViewport?.addEventListener('scroll', schedule);
        const resize = new ResizeObserver(schedule);
        resize.observe(element);
        const world = editor.view.dom.closest('.board-world');
        //
        // Canvas camera zoom and positioning do not emit window scroll events; follow them without scaling the editing popover.
        //
        const camera = new MutationObserver(schedule);
        if (world)
            camera.observe(world, {
                attributes: true,
                attributeFilter: ['style'],
            });
        schedule();
        return () => {
            editor.off('transaction', schedule);
            window.removeEventListener('resize', schedule);
            window.removeEventListener('scroll', schedule, true);
            window.visualViewport?.removeEventListener('resize', schedule);
            window.visualViewport?.removeEventListener('scroll', schedule);
            resize.disconnect();
            camera.disconnect();
            if (frame !== undefined) cancelAnimationFrame(frame);
        };
    }, [editor, mode]);
    return surface;
}
