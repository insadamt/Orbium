import { useBoardVisibleBounds } from './use-board-visible-bounds';
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
import {
    instantSceneBudgets,
    type BoardRendererMode,
} from './instant-scene/board-renderer-mode';
import { paintBoardCameraSurface } from './instant-scene/paint-board-camera-surface';

export function useBoardCamera(
    location: BoardLocation,
    rendererMode: BoardRendererMode = 'original',
) {
    const viewportRef = useRef<HTMLDivElement>(null);
    const worldRef = useRef<HTMLDivElement>(null);
    const gridLayerRef = useRef<HTMLDivElement>(null);
    const zoomLabelRef = useRef<HTMLSpanElement>(null);
    const cameraRef = useRef<BoardCamera>({ ...defaultBoardCamera });
    const diagnostics = useRef({ cameraPaints: 0, layoutDensityChanges: 0 });
    const frame = useRef<number | undefined>(undefined);
    const settleTimer = useRef<number | undefined>(undefined);
    const { visibleBounds, viewportSize, updateVisibleBounds } =
        useBoardVisibleBounds();
    const [grid, setGrid] = useState(true);
    const [snap, setSnap] = useState(false);
    const [guides, setGuides] = useState(true);
    const gridRef = useRef(grid);
    const storageKey = boardStorageKey(
        location,
        rendererMode === 'instant' ? 'instant.view.v1' : 'view.v1',
    );
    const minZoom =
        rendererMode === 'instant'
            ? instantSceneBudgets.minZoom
            : boardLimits.minZoom;
    const maxZoom =
        rendererMode === 'instant'
            ? instantSceneBudgets.maxZoom
            : boardLimits.maxZoom;

    const paintWorld = useCallback(
        (settleDensity = false) => {
            const world = worldRef.current;
            if (!world) return;
            const previousDensity = world.style.zoom;
            paintBoardCameraSurface({
                world,
                camera: cameraRef.current,
                mode: rendererMode,
                settleDensity,
            });
            if (previousDensity !== world.style.zoom)
                diagnostics.current.layoutDensityChanges++;
        },
        [rendererMode],
    );

    const settle = useCallback(() => {
        if (worldRef.current) {
            if (rendererMode === 'instant') paintWorld(true);
            delete worldRef.current.dataset.cameraMoving;
        }
        updateVisibleBounds(cameraRef.current);
        const camera = cameraRef.current;
        try {
            localStorage.setItem(
                storageKey,
                JSON.stringify({ ...camera, grid: gridRef.current }),
            );
        } catch {}
    }, [storageKey, updateVisibleBounds, rendererMode, paintWorld]);

    const paint = useCallback(() => {
        frame.current = undefined;
        diagnostics.current.cameraPaints++;
        const { x, y, zoom } = cameraRef.current;
        paintWorld();
        const viewport = viewportRef.current;
        if (viewport) {
            const inverseZoom = String(1 / zoom);
            if (
                viewport.style.getPropertyValue('--board-inverse-zoom') !==
                inverseZoom
            )
                viewport.style.setProperty('--board-inverse-zoom', inverseZoom);
        }
        const gridLayer = gridLayerRef.current;
        if (gridLayer) {
            const size = 32 * zoom;
            const patternSize = `${size}px ${size}px`;
            //
            // Compensate for the grid layer's negative inset so its dots retain the original world-space phase at fractional zoom.
            //
            const translation = `${(x + 128) % size}px ${(y + 128) % size}px`;
            if (gridLayer.hidden === gridRef.current)
                gridLayer.hidden = !gridRef.current;
            if (gridLayer.style.backgroundSize !== patternSize)
                gridLayer.style.backgroundSize = patternSize;
            if (gridLayer.style.translate !== translation)
                gridLayer.style.translate = translation;
        }
        const zoomLabel = `${Math.round(zoom * 100)}%`;
        if (
            zoomLabelRef.current &&
            zoomLabelRef.current.textContent !== zoomLabel
        )
            zoomLabelRef.current.textContent = zoomLabel;
        updateVisibleBounds(cameraRef.current);
    }, [updateVisibleBounds, paintWorld]);

    const setCamera = useCallback(
        (camera: BoardCamera) => {
            if (
                worldRef.current &&
                worldRef.current.dataset.cameraMoving !== 'true'
            )
                worldRef.current.dataset.cameraMoving = 'true';
            cameraRef.current = {
                x: clamp(camera.x, -40_000_000, 40_000_000),
                y: clamp(camera.y, -40_000_000, 40_000_000),
                zoom: clamp(camera.zoom, minZoom, maxZoom),
            };
            if (frame.current === undefined)
                frame.current = requestAnimationFrame(paint);
            clearTimeout(settleTimer.current);
            settleTimer.current = window.setTimeout(settle, 120);
        },
        [paint, settle, minZoom, maxZoom],
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
                clamp(cameraRef.current.zoom * factor, minZoom, maxZoom),
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
        const top = 64;
        const right = inspector && !compact ? inspector.offsetWidth + 48 : 48;
        const bottom = inspector && compact ? inspector.offsetHeight + 88 : 88;
        const availableWidth = Math.max(80, host.clientWidth - left - right);
        const availableHeight = Math.max(80, host.clientHeight - top - bottom);
        const zoom = clamp(
            Math.min(
                availableWidth / Math.max(bounds.width, 1),
                availableHeight / Math.max(bounds.height, 1),
            ),
            minZoom,
            Math.min(1.5, maxZoom),
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
        const measureViewport = () => {
            if (!host) return;
            viewportSize.current = {
                width: host.clientWidth,
                height: host.clientHeight,
            };
            settle();
        };
        const observer = new ResizeObserver(measureViewport);
        if (host) observer.observe(host);
        measureViewport();
        settle();
        const wheel = (event: WheelEvent) => {
            if (event.target instanceof Element) {
                if (
                    event.target.closest(
                        '.mindmap-viewport, [data-mindmap-dialog]',
                    )
                )
                    return;
                const body = event.target.closest<HTMLElement>(
                    '[data-board-resource-scroll], .board-object[data-editing="true"] [data-board-scroll], [data-board-player], video, audio, [role="slider"]',
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
                        clamp(
                            camera.zoom *
                                Math.exp(-event.deltaY * unit * 0.005),
                            minZoom,
                            maxZoom,
                        ),
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
            if (worldRef.current) delete worldRef.current.dataset.cameraMoving;
            host?.removeEventListener('wheel', wheel, { capture: true });
            if (frame.current !== undefined)
                cancelAnimationFrame(frame.current);
            clearTimeout(settleTimer.current);
            frame.current = undefined;
        };
    }, [storageKey, paint, setCamera, settle, viewportSize, minZoom, maxZoom]);

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
        readDiagnostics: () => ({ ...diagnostics.current }),
        minZoom,
        maxZoom,
        guides,
        toggleGuides,
        viewportRef,
        worldRef,
        gridLayerRef,
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
