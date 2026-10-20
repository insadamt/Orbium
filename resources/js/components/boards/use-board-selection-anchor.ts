import { useLayoutEffect, useRef } from 'react';
import type { BoardCameraController } from './use-board-camera';
import { clamp } from './board-geometry';

export function useBoardSelectionAnchor(
    camera: BoardCameraController,
    selectedIds: string[],
    editing: boolean,
) {
    const toolbarRef = useRef<HTMLDivElement>(null);
    const { viewportRef, worldRef, cameraRef } = camera;
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
        let viewportWidth = 0;
        let viewportHeight = 0;
        let toolbarWidth = 0;
        let toolbarHeight = 0;
        let viewportBorderLeft = 0;
        let viewportBorderTop = 0;
        const positionToolbar = () => {
            frame = undefined;
            const { x, y, zoom } = cameraRef.current;
            //
            // These inline values already contain the preview geometry; measuring rich DOM after every translation forces layout.
            //
            const objects = selectedElements.map((element) => {
                const [translateX = '0', translateY = '0'] =
                    element.style.translate.split(' ');
                const left =
                    (parseFloat(element.style.left) +
                        (parseFloat(translateX) || 0)) *
                        zoom +
                    x +
                    viewportBorderLeft;
                const top =
                    (parseFloat(element.style.top) +
                        (parseFloat(translateY) || 0)) *
                        zoom +
                    y +
                    viewportBorderTop;
                return {
                    left,
                    top,
                    right: left + parseFloat(element.style.width) * zoom,
                    bottom: top + parseFloat(element.style.height) * zoom,
                };
            });
            if (!objects.length) {
                toolbar.hidden = true;
                return;
            }
            const left = Math.min(...objects.map((object) => object.left));
            const right = Math.max(...objects.map((object) => object.right));
            const top = Math.min(...objects.map((object) => object.top));
            const bottom = Math.max(...objects.map((object) => object.bottom));
            const offscreen =
                right < 0 ||
                left > viewportWidth ||
                bottom < 0 ||
                top > viewportHeight;
            const hidden = !editing && offscreen;
            if (toolbar.hidden !== hidden) toolbar.hidden = hidden;
            if (toolbar.dataset.offscreen !== String(offscreen))
                toolbar.dataset.offscreen = String(offscreen);
            if (toolbar.hidden) return;
            const rightInset = 12;
            const minimumTop = 12;
            const maximumTop = Math.max(
                minimumTop,
                viewportHeight - toolbarHeight - 72,
            );
            const preferredTop = top - toolbarHeight - 14;
            const nextLeft = `${clamp((left + right) / 2 - toolbarWidth / 2, 12, Math.max(12, viewportWidth - rightInset - toolbarWidth))}px`;
            const nextTop = `${clamp(preferredTop >= minimumTop ? preferredTop : bottom + 14, minimumTop, maximumTop)}px`;
            if (toolbar.style.left !== nextLeft) toolbar.style.left = nextLeft;
            if (toolbar.style.top !== nextTop) toolbar.style.top = nextTop;
            if (toolbar.dataset.toolbarPositioned !== 'true')
                toolbar.dataset.toolbarPositioned = 'true';
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
        const measureSurfaces = () => {
            //
            // Cache dimensions when the surfaces actually resize, rather than alternating reads and writes every drag frame.
            //
            viewportWidth = viewport.clientWidth;
            viewportHeight = viewport.clientHeight;
            viewportBorderLeft = viewport.clientLeft;
            viewportBorderTop = viewport.clientTop;
            toolbarWidth = toolbar.offsetWidth;
            toolbarHeight = toolbar.offsetHeight;
            const maximumWidth = `${Math.min(640, Math.max(0, viewportWidth - 24))}px`;
            if (toolbar.style.maxWidth !== maximumWidth)
                toolbar.style.maxWidth = maximumWidth;
            schedulePosition();
        };
        const sizes = new ResizeObserver(measureSurfaces);
        const observeSelection = () => {
            sizes.disconnect();
            sizes.observe(viewport);
            sizes.observe(toolbar);
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
            for (const element of selectedElements) {
                sizes.observe(element);
                mutations.observe(element, {
                    attributes: true,
                    attributeFilter: ['style'],
                });
            }
        };
        observeSelection();
        measureSurfaces();
        return () => {
            mutations.disconnect();
            sizes.disconnect();
            if (frame !== undefined) cancelAnimationFrame(frame);
        };
    }, [viewportRef, worldRef, cameraRef, selectedIds, editing]);
    return toolbarRef;
}
