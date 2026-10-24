import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
    boardLimits,
    type BoardDrawingTool,
    type BoardPoint,
} from './board-types';
import {
    boardDrawingPath,
    boardDrawingPointLimit,
    boardEraserHitsStroke,
    createBoardDrawingObject,
    type BoardBrush,
} from './board-drawing-data';
import type { BoardObjectsController } from './use-board-objects';
import type { BoardCameraController } from './use-board-camera';
import {
    prepareBoardDrawingPoints,
    type BoardDrawingSmoothing,
} from './board-drawing-smoothing';

type DrawingGesture = {
    tool: BoardDrawingTool;
    brush: BoardBrush;
    points: [number, number][];
    renderedPoints: [number, number][];
    smoothing: BoardDrawingSmoothing;
    zoom: number;
    endpoint: BoardPoint | null;
    erasedIds: Set<string>;
    lastEraserPoint: BoardPoint;
    pendingEraserPoints: BoardPoint[];
    limited: boolean;
    bounds: { left: number; top: number; right: number; bottom: number };
};

export function useBoardDrawing(
    model: BoardObjectsController,
    camera: BoardCameraController,
    isLocked: () => boolean,
) {
    const [brush, setBrush] = useState<BoardBrush>({
        color: 'currentColor',
        width: 3,
    });
    const [smoothing, setSmoothing] = useState<BoardDrawingSmoothing>('light');
    const previewPathRef = useRef<SVGPathElement>(null);
    const gesture = useRef<DrawingGesture | null>(null);
    const frame = useRef<number | undefined>(undefined);
    const viewportRef = camera.viewportRef;

    function paintPreview() {
        frame.current = undefined;
        const current = gesture.current;
        if (!current) return;
        if (current.tool !== 'eraser') {
            current.renderedPoints = prepareBoardDrawingPoints({
                points: current.points,
                endpoint: current.endpoint,
                smoothing: current.smoothing,
                zoom: current.zoom,
                pointLimit: boardDrawingPointLimit,
            });
            previewPathRef.current?.setAttribute(
                'd',
                boardDrawingPath(current.renderedPoints),
            );
            return;
        }
        const radius = 10 / camera.cameraRef.current.zoom;
        for (const point of current.pendingEraserPoints.splice(0)) {
            for (const object of model.objectsRef.current) {
                if (
                    current.erasedIds.has(object.id) ||
                    !boardEraserHitsStroke(
                        object,
                        current.lastEraserPoint,
                        point,
                        radius,
                    )
                )
                    continue;
                current.erasedIds.add(object.id);
                viewportRef.current
                    ?.querySelector<HTMLElement>(
                        `[data-board-object-id="${object.id}"]`,
                    )
                    ?.setAttribute('data-board-erasing', 'true');
            }
            current.lastEraserPoint = point;
        }
    }

    function clearPreview() {
        const active = gesture.current !== null;
        gesture.current = null;
        if (frame.current !== undefined) cancelAnimationFrame(frame.current);
        frame.current = undefined;
        previewPathRef.current?.setAttribute('d', '');
        viewportRef.current
            ?.querySelectorAll('[data-board-erasing]')
            .forEach((element) =>
                element.removeAttribute('data-board-erasing'),
            );
        return active;
    }

    useEffect(
        () => () => {
            if (frame.current !== undefined)
                cancelAnimationFrame(frame.current);
        },
        [],
    );

    function start(tool: BoardDrawingTool, point: BoardPoint) {
        clearPreview();
        if (isLocked()) return;
        model.finishEditing();
        model.select([]);
        gesture.current = {
            tool,
            brush: { ...brush },
            points: [],
            renderedPoints: [],
            smoothing,
            zoom: camera.cameraRef.current.zoom,
            endpoint: null,
            erasedIds: new Set(),
            lastEraserPoint: point,
            pendingEraserPoints: [],
            limited: false,
            bounds: {
                left: point.x,
                top: point.y,
                right: point.x,
                bottom: point.y,
            },
        };
        const preview = previewPathRef.current;
        preview?.setAttribute('stroke', brush.color);
        preview?.setAttribute(
            'stroke-width',
            String(tool === 'highlighter' ? brush.width * 4 : brush.width),
        );
        preview?.setAttribute(
            'stroke-opacity',
            tool === 'highlighter' ? '0.3' : '1',
        );
        move([point]);
    }

    function move(points: BoardPoint[]) {
        const current = gesture.current;
        if (!current) return;
        for (const point of points) {
            if (current.tool === 'eraser') {
                current.pendingEraserPoints.push(point);
                continue;
            }
            if (
                current.endpoint?.x === point.x &&
                current.endpoint.y === point.y
            )
                continue;
            const bounds = {
                left: Math.min(current.bounds.left, point.x),
                top: Math.min(current.bounds.top, point.y),
                right: Math.max(current.bounds.right, point.x),
                bottom: Math.max(current.bounds.bottom, point.y),
            };
            //
            // Bound live input before allocating more points so one long gesture cannot exceed the saved geometry or byte budgets.
            //
            if (
                current.points.length >= boardDrawingPointLimit - 1 ||
                bounds.right - bounds.left > 3900 ||
                bounds.bottom - bounds.top > 3900 ||
                Math.abs(point.x) > boardLimits.coordinate - 32 ||
                Math.abs(point.y) > boardLimits.coordinate - 32
            ) {
                current.limited = true;
                continue;
            }
            current.bounds = bounds;
            current.endpoint = point;
            const previous = current.points.at(-1);
            if (
                !previous ||
                Math.hypot(point.x - previous[0], point.y - previous[1]) *
                    current.zoom >=
                    0.5
            )
                current.points.push([point.x, point.y]);
        }
        if (frame.current === undefined)
            frame.current = requestAnimationFrame(paintPreview);
    }

    function finish() {
        const current = gesture.current;
        if (!current) return;
        if (frame.current !== undefined) cancelAnimationFrame(frame.current);
        paintPreview();
        if (!isLocked()) {
            if (current.tool === 'eraser' && current.erasedIds.size) {
                model.commit(
                    model.objectsRef.current.filter(
                        (object) => !current.erasedIds.has(object.id),
                    ),
                );
            } else if (current.tool !== 'eraser' && current.points.length) {
                const layer = model.objectsRef.current.reduce(
                    (highest, object) => Math.max(highest, object.layer + 1),
                    0,
                );
                const object = createBoardDrawingObject(
                    current.renderedPoints,
                    current.brush,
                    current.tool === 'highlighter',
                    layer,
                );
                model.commit([...model.objectsRef.current, object]);
            }
            if (current.limited)
                toast.info(
                    'Stroke limit reached. Continue with another stroke.',
                );
        }
        clearPreview();
    }

    return {
        brush,
        setBrush,
        smoothing,
        setSmoothing,
        previewPathRef,
        start,
        move,
        finish,
        cancel: clearPreview,
    };
}

export type BoardDrawingController = ReturnType<typeof useBoardDrawing>;
