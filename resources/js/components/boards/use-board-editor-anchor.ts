import { useLayoutEffect, useRef } from 'react';
import type { Editor } from '@tiptap/core';
import { readBoardTextSelectionBounds } from './board-text-selection-bounds';

export function useBoardEditorAnchor(
    editor: Editor,
    mode: 'selection' | 'caret',
    boardId: number,
) {
    const surface = useRef<HTMLDivElement>(null);
    useLayoutEffect(() => {
        const element = surface.current;
        if (!element || editor.isDestroyed) return;
        const stage = document
            .getElementById(`board-formatting-${boardId}`)
            ?.closest('.board-stage');
        let frame: number | undefined;
        let selectingWithPointer = false;
        const position = () => {
            frame = undefined;
            if (editor.isDestroyed || !editor.view.dom.isConnected) return;
            const { to, empty } = editor.state.selection;
            if (mode === 'selection' && (empty || selectingWithPointer)) {
                element.hidden = true;
                return;
            }
            const end = editor.view.coordsAtPos(to);
            const selectionBounds =
                mode === 'selection'
                    ? readBoardTextSelectionBounds(editor)
                    : end;
            const canvas = stage
                ?.querySelector('.board-canvas')
                ?.getBoundingClientRect();
            const viewport = window.visualViewport;
            const leftEdge = Math.max(
                viewport?.offsetLeft ?? 0,
                canvas?.left ?? 0,
            );
            const topEdge = Math.max(
                viewport?.offsetTop ?? 0,
                canvas?.top ?? 0,
            );
            const rightEdge = Math.min(
                (viewport?.offsetLeft ?? 0) +
                    (viewport?.width ?? window.innerWidth),
                canvas?.right ?? window.innerWidth,
            );
            const bottomEdge = Math.min(
                (viewport?.offsetTop ?? 0) +
                    (viewport?.height ?? window.innerHeight),
                canvas?.bottom ?? window.innerHeight,
            );
            element.style.maxWidth = `${Math.max(0, rightEdge - leftEdge - 24)}px`;
            element.hidden =
                selectionBounds.bottom < topEdge ||
                selectionBounds.top > bottomEdge ||
                selectionBounds.right < leftEdge ||
                selectionBounds.left > rightEdge;
            if (element.hidden) return;
            const left =
                mode === 'caret'
                    ? end.left
                    : (selectionBounds.left + selectionBounds.right) / 2 -
                      element.offsetWidth / 2;
            const above = selectionBounds.top - element.offsetHeight - 10;
            const top =
                mode === 'selection' && above >= topEdge + 12
                    ? above
                    : selectionBounds.bottom + 10;
            element.dataset.toolbarPositioned = 'true';
            element.style.left = `${Math.max(leftEdge + 12, Math.min(left, rightEdge - element.offsetWidth - 12))}px`;
            element.style.top = `${Math.max(topEdge + 12, Math.min(top, bottomEdge - element.offsetHeight - 12))}px`;
        };
        const schedule = () => {
            if (frame === undefined) frame = requestAnimationFrame(position);
        };
        const beginPointerSelection = (event: PointerEvent) => {
            if (mode !== 'selection' || event.button !== 0) return;
            selectingWithPointer = true;
            element.hidden = true;
        };
        const finishPointerSelection = () => {
            if (!selectingWithPointer) return;
            selectingWithPointer = false;
            schedule();
        };
        const editorDom = editor.view.dom;
        editorDom.addEventListener('pointerdown', beginPointerSelection);
        window.addEventListener('pointerup', finishPointerSelection);
        window.addEventListener('pointercancel', finishPointerSelection);
        window.addEventListener('blur', finishPointerSelection);
        editor.on('transaction', schedule);
        window.addEventListener('resize', schedule);
        window.addEventListener('scroll', schedule, true);
        window.visualViewport?.addEventListener('resize', schedule);
        window.visualViewport?.addEventListener('scroll', schedule);
        const resize = new ResizeObserver(schedule);
        resize.observe(element);
        const world = stage?.querySelector('.board-world');
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
            editorDom.removeEventListener('pointerdown', beginPointerSelection);
            window.removeEventListener('pointerup', finishPointerSelection);
            window.removeEventListener('pointercancel', finishPointerSelection);
            window.removeEventListener('blur', finishPointerSelection);
            editor.off('transaction', schedule);
            window.removeEventListener('resize', schedule);
            window.removeEventListener('scroll', schedule, true);
            window.visualViewport?.removeEventListener('resize', schedule);
            window.visualViewport?.removeEventListener('scroll', schedule);
            resize.disconnect();
            camera.disconnect();
            if (frame !== undefined) cancelAnimationFrame(frame);
        };
    }, [editor, mode, boardId]);
    return surface;
}
