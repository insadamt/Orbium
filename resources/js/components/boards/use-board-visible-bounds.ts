import { useCallback, useRef, useState } from 'react';
import type { BoardBounds, BoardCamera } from './board-types';

export function useBoardVisibleBounds() {
    const [visibleBounds, setVisibleBounds] = useState<BoardBounds>({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
    });
    const publishedBounds = useRef(visibleBounds);
    const publishedView = useRef({ zoom: 0, width: 0, height: 0 });
    const viewportSize = useRef({ width: 0, height: 0 });
    const updateVisibleBounds = useCallback((camera: BoardCamera) => {
        const { width, height } = viewportSize.current;
        if (!width || !height) return;
        const viewport: BoardBounds = {
            x: -camera.x / camera.zoom,
            y: -camera.y / camera.zoom,
            width: width / camera.zoom,
            height: height / camera.zoom,
        };
        const previous = publishedBounds.current;
        const guard = 160 / camera.zoom;
        //
        // Keep a stable mounting region until the viewport approaches its edge; camera frames should not publish new React bounds unnecessarily.
        //
        if (
            publishedView.current.zoom === camera.zoom &&
            publishedView.current.width === width &&
            publishedView.current.height === height &&
            viewport.x - guard >= previous.x &&
            viewport.y - guard >= previous.y &&
            viewport.x + viewport.width + guard <=
                previous.x + previous.width &&
            viewport.y + viewport.height + guard <= previous.y + previous.height
        )
            return;
        const overscan = 640 / camera.zoom;
        const next = {
            x: viewport.x - overscan,
            y: viewport.y - overscan,
            width: viewport.width + overscan * 2,
            height: viewport.height + overscan * 2,
        };
        publishedView.current = { zoom: camera.zoom, width, height };
        publishedBounds.current = next;
        setVisibleBounds(next);
    }, []);
    return { visibleBounds, viewportSize, updateVisibleBounds };
}
