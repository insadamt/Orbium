import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import {
    canvasPoint,
    clamp,
    enclosingBounds,
    zoomAroundPoint,
} from './board-geometry';
import {
    boardLimits,
    boardStorageKey,
    defaultBoardCamera,
    type BoardBounds,
    type BoardCamera,
    type BoardLocation,
    type BoardPoint,
} from './board-types';

export function useBoardCamera(location: BoardLocation) {
    const viewportRef = useRef<HTMLDivElement>(null);
    const worldRef = useRef<HTMLDivElement>(null);
    const zoomLabelRef = useRef<HTMLSpanElement>(null);
    const cameraRef = useRef<BoardCamera>({ ...defaultBoardCamera });
    const frame = useRef<number | undefined>(undefined);
    const settleTimer = useRef<number | undefined>(undefined);
    const boundsTimer = useRef<number | undefined>(undefined);
    const [visibleBounds, setVisibleBounds] = useState<BoardBounds>({
        x: -2000,
        y: -2000,
        width: 4000,
        height: 4000,
    });
    const [grid, setGrid] = useState(true);
    const [snap, setSnap] = useState(false);
    const [guides, setGuides] = useState(true);
    const gridRef = useRef(grid);
    const storageKey = boardStorageKey(location, 'view.v1');

    const updateVisibleBounds = useCallback(() => {
        const camera = cameraRef.current;
        const host = viewportRef.current;
        if (host)
            setVisibleBounds({
                x: (-camera.x - 500) / camera.zoom,
                y: (-camera.y - 500) / camera.zoom,
                width: (host.clientWidth + 1000) / camera.zoom,
                height: (host.clientHeight + 1000) / camera.zoom,
            });
    }, []);
    const settle = useCallback(() => {
        updateVisibleBounds();
        const camera = cameraRef.current;
        try {
            localStorage.setItem(
                storageKey,
                JSON.stringify({ ...camera, grid: gridRef.current }),
            );
        } catch {}
    }, [storageKey, updateVisibleBounds]);

    const paint = useCallback(() => {
        frame.current = undefined;
        const { x, y, zoom } = cameraRef.current;
        if (worldRef.current) {
            //
            // Layout zoom lets the browser rasterize text and vectors at their displayed size instead of stretching a cached world layer.
            //
            Object.assign(worldRef.current.style, {
                zoom: String(zoom),
                left: `${x / zoom}px`,
                top: `${y / zoom}px`,
            });
        }
        const viewport = viewportRef.current;
        if (viewport) {
            viewport.style.backgroundSize = `${32 * zoom}px ${32 * zoom}px`;
            viewport.style.backgroundPosition = `${x}px ${y}px`;
            viewport.dataset.grid = String(gridRef.current);
            viewport.style.setProperty(
                '--board-inverse-zoom',
                String(1 / zoom),
            );
        }
        if (zoomLabelRef.current)
            zoomLabelRef.current.textContent = `${Math.round(zoom * 100)}%`;
    }, []);

    const setCamera = useCallback(
        (camera: BoardCamera) => {
            cameraRef.current = {
                x: clamp(camera.x, -40_000_000, 40_000_000),
                y: clamp(camera.y, -40_000_000, 40_000_000),
                zoom: clamp(
                    camera.zoom,
                    boardLimits.minZoom,
                    boardLimits.maxZoom,
                ),
            };
            if (frame.current === undefined)
                frame.current = requestAnimationFrame(paint);
            if (boundsTimer.current === undefined)
                boundsTimer.current = window.setTimeout(() => {
                    boundsTimer.current = undefined;
                    updateVisibleBounds();
                }, 120);
            clearTimeout(settleTimer.current);
            settleTimer.current = window.setTimeout(settle, 120);
        },
        [paint, settle, updateVisibleBounds],
    );

    function localPoint(point: BoardPoint): BoardPoint {
        const bounds = viewportRef.current?.getBoundingClientRect();
        return {
            x: point.x - (bounds?.left ?? 0),
            y: point.y - (bounds?.top ?? 0),
        };
    }
    function worldPoint(point: BoardPoint) {
        return canvasPoint(localPoint(point), cameraRef.current);
    }
    function centerPoint() {
        const host = viewportRef.current;
        return canvasPoint(
            {
                x: (host?.clientWidth ?? 640) / 2,
                y: (host?.clientHeight ?? 480) / 2,
            },
            cameraRef.current,
        );
    }
    function zoomBy(factor: number) {
        const host = viewportRef.current;
        setCamera(
            zoomAroundPoint(
                cameraRef.current,
                {
                    x: (host?.clientWidth ?? 640) / 2,
                    y: (host?.clientHeight ?? 480) / 2,
                },
                cameraRef.current.zoom * factor,
            ),
        );
    }
    function fit(objects: BoardBounds[]) {
        const bounds = enclosingBounds(objects);
        const host = viewportRef.current;
        if (!bounds || !host) {
            setCamera({ ...defaultBoardCamera });
            return;
        }
        const inspector = host.parentElement?.querySelector<HTMLElement>(
            '[data-board-properties]',
        );
        const compact = host.clientWidth < 900;
        const left = 48;
        const top = 112;
        const right = inspector && !compact ? inspector.offsetWidth + 48 : 48;
        const bottom =
            inspector && compact ? inspector.offsetHeight + 160 : 160;
        const availableWidth = Math.max(80, host.clientWidth - left - right);
        const availableHeight = Math.max(80, host.clientHeight - top - bottom);
        const zoom = clamp(
            Math.min(
                availableWidth / Math.max(bounds.width, 1),
                availableHeight / Math.max(bounds.height, 1),
            ),
            boardLimits.minZoom,
            Math.min(1.5, boardLimits.maxZoom),
        );
        setCamera({
            zoom,
            x: left + availableWidth / 2 - (bounds.x + bounds.width / 2) * zoom,
            y:
                top +
                availableHeight / 2 -
                (bounds.y + bounds.height / 2) * zoom,
        });
    }

    useLayoutEffect(() => {
        try {
            const saved = JSON.parse(
                localStorage.getItem(storageKey) ?? 'null',
            ) as (Partial<BoardCamera> & { grid?: boolean }) | null;
            if (
                saved &&
                [saved.x, saved.y, saved.zoom].every(
                    (value) =>
                        typeof value === 'number' && Number.isFinite(value),
                )
            ) {
                setCamera({ x: saved.x!, y: saved.y!, zoom: saved.zoom! });
                gridRef.current = saved.grid !== false;
                setGrid(gridRef.current);
            }
            setSnap(localStorage.getItem(`${storageKey}.snap`) === 'true');
            setGuides(localStorage.getItem(`${storageKey}.guides`) !== 'false');
        } catch {}
        paint();
        const host = viewportRef.current;
        const observer = new ResizeObserver(settle);
        if (host) observer.observe(host);
        settle();
        const wheel = (event: WheelEvent) => {
            if (event.target instanceof Element) {
                const body = event.target.closest<HTMLElement>(
                    '.board-object[data-editing="true"] [data-board-scroll], [data-board-player], video, audio, [role="slider"]',
                );
                if (body && !event.ctrlKey && !event.metaKey) return;
            }
            event.preventDefault();
            if (event.ctrlKey || event.metaKey) event.stopPropagation();
            const camera = cameraRef.current;
            const unit =
                event.deltaMode === 1
                    ? 16
                    : event.deltaMode === 2
                      ? (host?.clientHeight ?? 600)
                      : 1;
            if (event.ctrlKey || event.metaKey)
                setCamera(
                    zoomAroundPoint(
                        camera,
                        {
                            x:
                                event.clientX -
                                (host?.getBoundingClientRect().left ?? 0),
                            y:
                                event.clientY -
                                (host?.getBoundingClientRect().top ?? 0),
                        },
                        camera.zoom * Math.exp(-event.deltaY * unit * 0.005),
                    ),
                );
            else
                setCamera({
                    ...camera,
                    x:
                        camera.x -
                        (event.shiftKey && event.deltaX === 0
                            ? event.deltaY
                            : event.deltaX) *
                            unit,
                    y:
                        camera.y -
                        (event.shiftKey && event.deltaX === 0
                            ? 0
                            : event.deltaY) *
                            unit,
                });
        };
        host?.addEventListener('wheel', wheel, {
            passive: false,
            capture: true,
        });
        return () => {
            observer.disconnect();
            host?.removeEventListener('wheel', wheel, { capture: true });
            if (frame.current !== undefined)
                cancelAnimationFrame(frame.current);
            clearTimeout(settleTimer.current);
            clearTimeout(boundsTimer.current);
            boundsTimer.current = undefined;
            frame.current = undefined;
        };
    }, [storageKey, paint, setCamera, settle]);

    function toggleGrid() {
        gridRef.current = !gridRef.current;
        setGrid(gridRef.current);
        paint();
        settle();
    }
    function toggleSnap() {
        const next = !snap;
        setSnap(next);
        try {
            localStorage.setItem(`${storageKey}.snap`, String(next));
        } catch {}
    }

    function toggleGuides() {
        const next = !guides;
        setGuides(next);
        try {
            localStorage.setItem(`${storageKey}.guides`, String(next));
        } catch {}
    }
    return {
        guides,
        toggleGuides,
        viewportRef,
        worldRef,
        zoomLabelRef,
        cameraRef,
        visibleBounds,
        setCamera,
        localPoint,
        worldPoint,
        centerPoint,
        zoomBy,
        fit,
        grid,
        snap,
        toggleGrid,
        toggleSnap,
        reset: () => setCamera({ ...defaultBoardCamera }),
    };
}

export type BoardCameraController = ReturnType<typeof useBoardCamera>;
