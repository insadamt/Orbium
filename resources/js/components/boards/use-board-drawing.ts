// Summary: Buffers Board ink/eraser gestures and commits once on release; depends on canonical history, smoothing, the camera and optional Konva preview painting.

import { useBoardPathDrawing } from './use-board-path-drawing';
import { boardGraphics } from './konva/board-graphics-bridge';
import { BoardStreamingStroke } from './konva/board-streaming-stroke';
import { boardFragmentsPath } from './konva/board-konva-geometry';
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
    createBoardDrawingObject,
    type BoardBrush,
} from './board-drawing-data';
import { BoardEraserSession, boardEraserCursor } from './board-eraser-session';
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
    streaming: BoardStreamingStroke | null;
    smoothing: BoardDrawingSmoothing;
    zoom: number;
    endpoint: BoardPoint | null;
    eraser: BoardEraserSession | null;
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
    const path = useBoardPathDrawing(model, camera, brush, isLocked);
    const [eraserSize, setEraserSize] = useState(16);
    const [smoothing, setSmoothing] = useState<BoardDrawingSmoothing>('light');
    const previewPathRef = useRef<SVGPathElement>(null);
    const gesture = useRef<DrawingGesture | null>(null);
    const frame = useRef<number | undefined>(undefined);
    const viewportRef = camera.viewportRef;
    const paintCurrentPreview = useRef(paintPreview);
    paintCurrentPreview.current = paintPreview;

    useEffect(() => {
        const viewport = viewportRef.current;
        const repaint = () => {
            gesture.current?.eraser?.invalidatePreview();
            if (gesture.current && frame.current === undefined)
                frame.current = requestAnimationFrame(() =>
                    paintCurrentPreview.current(),
                );
        };
        viewport?.addEventListener('board-graphics-change', repaint);
        return () =>
            viewport?.removeEventListener('board-graphics-change', repaint);
    }, [viewportRef]);

    useEffect(() => {
        const viewport = viewportRef.current;
        viewport?.style.setProperty(
            '--board-eraser-cursor',
            boardEraserCursor(eraserSize),
        );
        return () => {
            viewport?.style.removeProperty('--board-eraser-cursor');
        };
    }, [eraserSize, viewportRef]);

    function paintPreview() {
        frame.current = undefined;
        const current = gesture.current;
        if (!current) return;
        if (current.tool !== 'eraser') {
            if (current.streaming) {
                const tail = current.streaming.prepare(
                    current.points,
                    current.endpoint,
                );
                const graphics = boardGraphics(viewportRef.current);
                if (graphics)
                    graphics.paintStroke({
                        completed: current.streaming.completedPath,
                        tail,
                        brush: current.brush,
                        highlighter: current.tool === 'highlighter',
                    });
                else
                    previewPathRef.current?.setAttribute(
                        'd',
                        boardDrawingPath(current.streaming.finish()),
                    );
                return;
            }
            current.renderedPoints = prepareBoardDrawingPoints({
                points: current.points,
                endpoint: current.endpoint,
                smoothing: current.smoothing,
                zoom: current.zoom,
                pointLimit: boardDrawingPointLimit,
            });
            const graphics = boardGraphics(viewportRef.current);
            if (graphics)
                graphics.paintStroke({
                    completed: boardFragmentsPath([current.renderedPoints]),
                    tail: [],
                    brush: current.brush,
                    highlighter: current.tool === 'highlighter',
                });
            else
                previewPathRef.current?.setAttribute(
                    'd',
                    boardDrawingPath(current.renderedPoints),
                );
            return;
        }
        for (const point of current.pendingEraserPoints.splice(0)) {
            current.eraser?.eraseSweep(
                model.objectsRef.current,
                current.lastEraserPoint,
                point,
            );
            current.lastEraserPoint = point;
        }
        current.eraser?.paintPreview(viewportRef.current);
    }

    function clearPreview() {
        const pathActive = path.cancel();
        const active = gesture.current !== null || pathActive;
        gesture.current?.eraser?.restorePreview();
        gesture.current = null;
        if (frame.current !== undefined) cancelAnimationFrame(frame.current);
        frame.current = undefined;
        previewPathRef.current?.setAttribute('d', '');
        boardGraphics(viewportRef.current)?.paintStroke(null);
        return active;
    }

    useEffect(
        () => () => {
            if (frame.current !== undefined)
                cancelAnimationFrame(frame.current);
        },
        [],
    );

    function start(tool: BoardDrawingTool, point: BoardPoint, shift = false) {
        if (tool === 'path') {
            if (isLocked()) return;
            model.finishEditing();
            model.select([]);
            path.addPoint(point, shift);
            return;
        }
        clearPreview();
        if (isLocked()) return;
        model.finishEditing();
        model.select([]);
        gesture.current = {
            tool,
            brush: { ...brush },
            points: [],
            renderedPoints: [],
            streaming:
                tool !== 'eraser' && boardGraphics(viewportRef.current)
                    ? new BoardStreamingStroke(
                          smoothing,
                          camera.cameraRef.current.zoom,
                      )
                    : null,
            smoothing,
            zoom: camera.cameraRef.current.zoom,
            endpoint: null,
            eraser:
                tool === 'eraser'
                    ? new BoardEraserSession(
                          eraserSize / 2 / camera.cameraRef.current.zoom,
                      )
                    : null,
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
            if (current.tool === 'eraser') {
                const nextObjects = current.eraser?.limited
                    ? null
                    : current.eraser?.createObjects(model.objectsRef.current);
                clearPreview();
                if (current.eraser?.limited)
                    toast.info(
                        'Erase a smaller area in one drag. This erasure was canceled.',
                    );
                else if (nextObjects) model.commit(nextObjects);
                return;
            }
            if (current.points.length) {
                if (current.streaming)
                    current.renderedPoints = current.streaming.finish();
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
        path,
        brush,
        setBrush,
        smoothing,
        setSmoothing,
        eraserSize,
        setEraserSize,
        previewPathRef,
        start,
        move,
        finish,
        cancel: clearPreview,
    };
}

export type BoardDrawingController = ReturnType<typeof useBoardDrawing>;
