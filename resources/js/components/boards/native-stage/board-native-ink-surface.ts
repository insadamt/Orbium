// Summary: Rasterizes completed live-ink chunks once and repairs only the changing tail rectangle; depends on the Stage projection, a dedicated non-listening input Layer and canonical numeric points.

import Konva from 'konva';
import { appendBoardStrokePath } from '../konva/board-konva-geometry';
import type { BoardBrush } from '../board-drawing-data';

type StrokePoint = [number, number];
type PixelBounds = { x: number; y: number; width: number; height: number };

export function createNativeInkSurface(
    stage: Konva.Stage,
    layer: Konva.Layer,
    beforePaint: () => void,
    initialForeground: string,
) {
    const completed = document.createElement('canvas');
    const working = document.createElement('canvas');
    completed.width = completed.height = working.width = working.height = 0;
    const metrics = {
        previewFrames: 0,
        completedChunkRasterizations: 0,
        tailRasterizations: 0,
        repairedPixels: 0,
        fullReprojections: 0,
    };
    let chunks: StrokePoint[][] = [];
    let pending: StrokePoint[][] = [];
    let tail: StrokePoint[] = [];
    let brush: BoardBrush = { color: 'currentColor', width: 3 };
    let foreground = initialForeground;
    let alpha = 1;
    let active = false;
    let projection = '';
    let previousTail: PixelBounds | null = null;

    function bounds(points: StrokePoint[]): PixelBounds | null {
        if (!points.length) return null;
        const ratio = layer.getCanvas().getPixelRatio();
        const scale = stage.scaleX() * ratio;
        const padding = (brush.width * scale) / 2 + 3;
        const xs = points.map(([x]) => x * scale + stage.x() * ratio);
        const ys = points.map(([, y]) => y * scale + stage.y() * ratio);
        const x = Math.max(0, Math.floor(Math.min(...xs) - padding));
        const y = Math.max(0, Math.floor(Math.min(...ys) - padding));
        const right = Math.min(
            working.width,
            Math.ceil(Math.max(...xs) + padding),
        );
        const bottom = Math.min(
            working.height,
            Math.ceil(Math.max(...ys) + padding),
        );
        return right > x && bottom > y
            ? { x, y, width: right - x, height: bottom - y }
            : null;
    }
    function union(boxes: (PixelBounds | null)[]) {
        const present = boxes.filter((box): box is PixelBounds => box !== null);
        if (!present.length) return null;
        const x = Math.min(...present.map((box) => box.x));
        const y = Math.min(...present.map((box) => box.y));
        return {
            x,
            y,
            width: Math.max(...present.map((box) => box.x + box.width)) - x,
            height: Math.max(...present.map((box) => box.y + box.height)) - y,
        };
    }
    function stroke(context: CanvasRenderingContext2D, points: StrokePoint[]) {
        if (!points.length) return;
        const ratio = layer.getCanvas().getPixelRatio();
        context.setTransform(
            stage.scaleX() * ratio,
            0,
            0,
            stage.scaleY() * ratio,
            stage.x() * ratio,
            stage.y() * ratio,
        );
        context.strokeStyle =
            brush.color === 'currentColor' ? foreground : brush.color;
        context.lineWidth = brush.width;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        const path = new Path2D();
        appendBoardStrokePath(path, points);
        context.stroke(path);
    }

    const node = new Konva.Shape({
        listening: false,
        perfectDrawEnabled: false,
        sceneFunc(context) {
            beforePaint();
            if (!active) return;
            const ratio = layer.getCanvas().getPixelRatio();
            const width = Math.ceil(stage.width() * ratio);
            const height = Math.ceil(stage.height() * ratio);
            const nextProjection = `${stage.x()}:${stage.y()}:${stage.scaleX()}:${width}:${height}:${brush.color}:${brush.width}:${foreground}`;
            const reproject = projection !== nextProjection;
            if (completed.width !== width || completed.height !== height) {
                completed.width = working.width = width;
                completed.height = working.height = height;
            }
            const completeContext = completed.getContext('2d');
            const workContext = working.getContext('2d');
            if (!completeContext || !workContext) return;
            if (reproject) {
                completeContext.setTransform(1, 0, 0, 1, 0, 0);
                completeContext.clearRect(0, 0, width, height);
                pending = [...chunks];
                previousTail = null;
                metrics.fullReprojections++;
            }
            for (const chunk of pending) {
                stroke(completeContext, chunk);
                metrics.completedChunkRasterizations++;
            }
            const tailBounds = bounds(tail);
            const dirty = reproject
                ? { x: 0, y: 0, width, height }
                : union([previousTail, tailBounds, ...pending.map(bounds)]);
            if (dirty) {
                workContext.save();
                workContext.setTransform(1, 0, 0, 1, 0, 0);
                workContext.beginPath();
                workContext.rect(dirty.x, dirty.y, dirty.width, dirty.height);
                workContext.clip();
                workContext.clearRect(
                    dirty.x,
                    dirty.y,
                    dirty.width,
                    dirty.height,
                );
                workContext.drawImage(
                    completed,
                    dirty.x,
                    dirty.y,
                    dirty.width,
                    dirty.height,
                    dirty.x,
                    dirty.y,
                    dirty.width,
                    dirty.height,
                );
                stroke(workContext, tail);
                workContext.restore();
                metrics.repairedPixels += dirty.width * dirty.height;
                if (tail.length) metrics.tailRasterizations++;
            }
            pending = [];
            previousTail = tailBounds;
            projection = nextProjection;
            const native = context._context;
            native.setTransform(1, 0, 0, 1, 0, 0);
            //
            // Apply highlighter alpha once to the combined opaque ink mask, including self-crossings and chunk joins.
            //
            native.globalAlpha = alpha;
            native.drawImage(working, 0, 0);
            metrics.previewFrames++;
        },
    });
    layer.add(node);

    return {
        metrics,
        requestPaint: () => layer.batchDraw(),
        update(
            newChunks: StrokePoint[][],
            nextTail: StrokePoint[],
            nextBrush: BoardBrush,
            nextAlpha = 1,
        ) {
            active = true;
            chunks.push(...newChunks);
            pending.push(...newChunks);
            tail = nextTail;
            brush = nextBrush;
            alpha = nextAlpha;
        },
        reset(
            placed: StrokePoint[][],
            nextTail: StrokePoint[],
            nextBrush: BoardBrush,
        ) {
            chunks = placed;
            pending = [];
            tail = nextTail;
            brush = nextBrush;
            alpha = 1;
            active = true;
            projection = '';
        },
        recolor(color: string) {
            foreground = color;
            if (active) layer.batchDraw();
        },
        readCanvases: () => [
            {
                role: 'live-completed-chunk-cache',
                width: completed.width,
                height: completed.height,
                ratio: layer.getCanvas().getPixelRatio(),
            },
            {
                role: 'live-tail-composition',
                width: working.width,
                height: working.height,
                ratio: layer.getCanvas().getPixelRatio(),
            },
        ],
        clear() {
            active = false;
            chunks = [];
            pending = [];
            tail = [];
            previousTail = null;
            projection = '';
            completed.width =
                completed.height =
                working.width =
                working.height =
                    0;
            layer.batchDraw();
        },
        dispose() {
            node.destroy();
            completed.width =
                completed.height =
                working.width =
                working.height =
                    0;
            chunks = [];
            pending = [];
            tail = [];
        },
    };
}

export type NativeInkSurface = ReturnType<typeof createNativeInkSurface>;
