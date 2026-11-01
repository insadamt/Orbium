// Summary: Buffers coalesced drawing/erasing input outside React and commits one canonical record transaction on release; depends on existing chunk smoothing, Path Pen and spatial partial erasure.

import { BoardStreamingStroke } from '../konva/board-streaming-stroke';
import {
    boardDrawingPointLimit,
    createBoardDrawingObject,
    type BoardBrush,
} from '../board-drawing-data';
import type { BoardDrawingSmoothing } from '../board-drawing-smoothing';
import {
    boardLimits,
    type BoardDrawingTool,
    type BoardPoint,
} from '../board-types';
import { createNativeEraser, type NativeEraser } from './board-native-eraser';
import type { NativeBoardGraphics } from './board-native-graphics';
import type { NativeInkSurface } from './board-native-ink-surface';
import type { createNativePath } from './board-native-path';
import type Konva from 'konva';

export type NativeDrawingSettings = {
    brush: BoardBrush;
    smoothing: BoardDrawingSmoothing;
    eraserSize: number;
};
type StrokePoint = [number, number];
type InkGesture = {
    tool: BoardDrawingTool;
    brush: BoardBrush;
    zoom: number;
    stream: BoardStreamingStroke;
    raw: StrokePoint[];
    endpoint: BoardPoint | null;
    chunks: StrokePoint[][];
    bounds: { left: number; top: number; right: number; bottom: number };
    limited: boolean;
    eraser: NativeEraser | null;
    pendingEraser: BoardPoint[];
    lastEraser: BoardPoint;
};

export function createNativeDrawing({
    stage,
    graphics,
    surface,
    path,
    notice,
}: {
    stage: Konva.Stage;
    graphics: NativeBoardGraphics;
    surface: NativeInkSurface;
    path: ReturnType<typeof createNativePath>;
    notice: (message: string) => void;
}) {
    let settings: NativeDrawingSettings = {
        brush: { color: 'currentColor', width: 3 },
        smoothing: 'light',
        eraserSize: 16,
    };
    let gesture: InkGesture | null = null;
    const metrics = {
        rawSamples: 0,
        preparedFrames: 0,
        completedChunks: 0,
        committedStrokes: 0,
        committedErases: 0,
        canceledGestures: 0,
        eraserSweeps: 0,
        eraserCandidates: 0,
    };

    function move(points: BoardPoint[]) {
        if (!gesture) return;
        const current = gesture;
        let changed = false;
        for (const point of points) {
            metrics.rawSamples++;
            if (current.eraser) {
                if (current.eraser.limited) continue;
                current.pendingEraser.push(point);
                changed = true;
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
            if (
                !Number.isFinite(point.x) ||
                !Number.isFinite(point.y) ||
                current.raw.length >= boardDrawingPointLimit - 1 ||
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
            changed = true;
            const last = current.raw.at(-1);
            if (
                !last ||
                Math.hypot(point.x - last[0], point.y - last[1]) *
                    current.zoom >=
                    0.5
            )
                current.raw.push([point.x, point.y]);
        }
        if (changed) surface.requestPaint();
    }
    function flush() {
        const current = gesture;
        if (!current) return;
        if (current.eraser) {
            for (const point of current.pendingEraser.splice(0)) {
                current.eraser.sweep(current.lastEraser, point);
                current.lastEraser = point;
            }
            current.eraser.paint();
        } else {
            const tail = current.stream.prepare(current.raw, current.endpoint);
            const chunks = current.chunks.splice(0);
            metrics.completedChunks += chunks.length;
            surface.update(
                chunks,
                tail,
                {
                    color: current.brush.color,
                    width:
                        current.brush.width *
                        (current.tool === 'highlighter' ? 4 : 1),
                },
                current.tool === 'highlighter' ? 0.3 : 1,
            );
        }
        metrics.preparedFrames++;
    }
    function cancelGesture() {
        const active = gesture !== null;
        gesture?.eraser?.restore();
        gesture = null;
        if (active) {
            metrics.canceledGestures++;
            surface.clear();
        }
        return active;
    }

    return {
        metrics,
        flush,
        move,
        path,
        start(tool: BoardDrawingTool, point: BoardPoint, shift: boolean) {
            if (tool === 'path') {
                path.add(point, shift, settings.brush);
                return;
            }
            cancelGesture();
            path.cancel();
            const chunks: StrokePoint[][] = [];
            const zoom = stage.scaleX();
            gesture = {
                tool,
                brush: { ...settings.brush },
                zoom,
                stream: new BoardStreamingStroke(
                    settings.smoothing,
                    zoom,
                    (chunk) => chunks.push(chunk),
                ),
                chunks,
                raw: [],
                endpoint: null,
                bounds: {
                    left: point.x,
                    top: point.y,
                    right: point.x,
                    bottom: point.y,
                },
                limited: false,
                eraser:
                    tool === 'eraser'
                        ? createNativeEraser(
                              graphics,
                              settings.eraserSize / 2 / zoom,
                          )
                        : null,
                pendingEraser: [],
                lastEraser: point,
            };
            move([point]);
        },
        finish() {
            const current = gesture;
            if (!current) return;
            flush();
            if (current.eraser) {
                metrics.eraserSweeps += current.eraser.metrics.sweeps;
                metrics.eraserCandidates += current.eraser.metrics.candidates;
                current.eraser.restore();
                if (current.eraser.limited || !current.eraser.commit())
                    notice(
                        'Erase a smaller area in one drag. This erasure was canceled.',
                    );
                else if (current.eraser.hasChanges) metrics.committedErases++;
            } else if (current.raw.length) {
                const object = createBoardDrawingObject(
                    current.stream.finish(),
                    current.brush,
                    current.tool === 'highlighter',
                    graphics.store.getObjects().length,
                );
                if (graphics.insertDrawing(object)) metrics.committedStrokes++;
                else
                    notice(
                        'This drawing exceeds the Board limits. No partial object was added.',
                    );
                if (current.limited)
                    notice(
                        'Stroke limit reached. Continue with another stroke.',
                    );
            }
            gesture = null;
            surface.clear();
        },
        cancelGesture,
        cancelAll() {
            const active = cancelGesture();
            return path.cancel() || active;
        },
        setSettings(next: NativeDrawingSettings) {
            settings = next;
            path.setBrush(next.brush);
        },
        get active() {
            return gesture !== null;
        },
    };
}

export type NativeDrawing = ReturnType<typeof createNativeDrawing>;
