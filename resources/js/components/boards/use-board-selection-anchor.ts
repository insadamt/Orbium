import { useLayoutEffect, useRef } from 'react';
import type { BoardCameraController } from './use-board-camera';
import { clamp } from './board-geometry';

export function useBoardSelectionAnchor(
    camera: BoardCameraController,
    selectedIds: string[],
    editing: boolean,
    propertiesOpen: boolean,
) {
    const toolbarRef = useRef<HTMLDivElement>(null);
    const { viewportRef, worldRef } = camera;
    useLayoutEffect(() => {
        const viewport = viewportRef.current;
        const world = worldRef.current;
        const toolbar = toolbarRef.current;
        if (!viewport || !world || !toolbar) return;
        if (!selectedIds.length) {
            toolbar.hidden = true;
            return;
        }
        let frame: number | undefined;
        let selectedElements: HTMLElement[] = [];
        const selectedSet = new Set(selectedIds);
        const positionToolbar = () => {
            frame = undefined;
            const compact = viewport.clientWidth < 900;
            const bounds = viewport.getBoundingClientRect();
            const objects = selectedElements.map((element) =>
                element.getBoundingClientRect(),
            );
            if (!objects.length) {
                toolbar.hidden = true;
                return;
            }
            const left =
                Math.min(...objects.map((object) => object.left)) - bounds.left;
            const right =
                Math.max(...objects.map((object) => object.right)) -
                bounds.left;
            const top =
                Math.min(...objects.map((object) => object.top)) - bounds.top;
            const bottom =
                Math.max(...objects.map((object) => object.bottom)) -
                bounds.top;
            const offscreen =
                right < 0 ||
                left > viewport.clientWidth ||
                bottom < 0 ||
                top > viewport.clientHeight;
            toolbar.hidden =
                (!editing && offscreen) || (compact && propertiesOpen);
            toolbar.dataset.offscreen = String(offscreen);
            if (toolbar.hidden) return;
            const inspector =
                viewport.parentElement?.querySelector<HTMLElement>(
                    '[data-board-properties]',
                );
            const rightInset =
                inspector && !compact ? inspector.offsetWidth + 40 : 12;
            const availableWidth = viewport.clientWidth - rightInset - 12;
            toolbar.style.maxWidth = `${Math.min(640, availableWidth)}px`;
            const minimumTop = 56;
            const maximumTop = Math.max(
                minimumTop,
                viewport.clientHeight - toolbar.offsetHeight - 72,
            );
            const preferredTop = top - toolbar.offsetHeight - 14;
            toolbar.style.left = `${clamp((editing ? availableWidth : left + right) / 2 - toolbar.offsetWidth / 2, 12, Math.max(12, viewport.clientWidth - rightInset - toolbar.offsetWidth))}px`;
            toolbar.style.top = `${editing ? maximumTop : clamp(preferredTop >= minimumTop ? preferredTop : bottom + 14, minimumTop, maximumTop)}px`;
        };
        const schedulePosition = () => {
            if (frame === undefined)
                frame = requestAnimationFrame(positionToolbar);
        };
        //
        // Only camera and selected geometry move this toolbar; observing every rich preview also caused needless layout reads while typing elsewhere.
        //
        const mutations = new MutationObserver((records) => {
            if (records.some((record) => record.type === 'childList'))
                observeSelection();
            schedulePosition();
        });
        const observeSelection = () => {
            mutations.disconnect();
            mutations.observe(world, {
                attributes: true,
                attributeFilter: ['style'],
                childList: true,
            });
            selectedElements = [
                ...world.querySelectorAll<HTMLElement>(
                    '[data-board-object-id]',
                ),
            ].filter((element) =>
                selectedSet.has(element.dataset.boardObjectId ?? ''),
            );
            for (const element of selectedElements)
                mutations.observe(element, {
                    attributes: true,
                    attributeFilter: ['style'],
                });
        };
        observeSelection();
        const sizes = new ResizeObserver(schedulePosition);
        sizes.observe(viewport);
        sizes.observe(toolbar);
        positionToolbar();
        return () => {
            mutations.disconnect();
            sizes.disconnect();
            if (frame !== undefined) cancelAnimationFrame(frame);
        };
    }, [viewportRef, worldRef, selectedIds, editing, propertiesOpen]);
    return toolbarRef;
}
