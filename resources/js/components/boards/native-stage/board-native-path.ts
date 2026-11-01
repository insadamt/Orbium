// Summary: Owns canonical multi-click Path Pen drafts, incremental placed segments and native anchor feedback; depends on scratch graphics, the shared Stage camera and the live ink surface.

import Konva from 'konva';
import {
    boardDrawingPointLimit,
    createBoardDrawingObject,
    type BoardBrush,
} from '../board-drawing-data';
import { boardLimits, type BoardPoint } from '../board-types';
import type { NativeBoardGraphics } from './board-native-graphics';
import type { NativeInkSurface } from './board-native-ink-surface';

type StrokePoint = [number, number];

export function createNativePath({
    stage,
    layer,
    graphics,
    surface,
    notify,
    notice,
}: {
    stage: Konva.Stage;
    layer: Konva.Layer;
    graphics: NativeBoardGraphics;
    surface: NativeInkSurface;
    notify: (count: number) => void;
    notice: (message: string) => void;
}) {
    let points: StrokePoint[] = [];
    let hover: StrokePoint[] = [];
    let brush: BoardBrush = { color: 'currentColor', width: 3 };
    const anchors = new Konva.Shape({
        listening: false,
        sceneFunc(context) {
            context.setAttr('strokeStyle', getForeground());
            context.setAttr('lineWidth', 1 / stage.scaleX());
            const size = 5 / stage.scaleX();
            for (const [x, y] of points)
                context.strokeRect(x - size / 2, y - size / 2, size, size);
        },
    });
    let foreground = '#000000';
    const getForeground = () => foreground;
    layer.add(anchors);
    function withinLimits(next: StrokePoint[]) {
        return (
            next.length <= boardDrawingPointLimit &&
            next.every(
                ([x, y]) =>
                    Number.isFinite(x) &&
                    Number.isFinite(y) &&
                    Math.abs(x) <= boardLimits.coordinate - 32 &&
                    Math.abs(y) <= boardLimits.coordinate - 32,
            ) &&
            Math.max(...next.map(([x]) => x)) -
                Math.min(...next.map(([x]) => x)) <=
                3900 &&
            Math.max(...next.map(([, y]) => y)) -
                Math.min(...next.map(([, y]) => y)) <=
                3900
        );
    }
    function snap(point: BoardPoint, shift: boolean): StrokePoint {
        const last = points.at(-1);
        if (!last || !shift) return [point.x, point.y];
        const dx = point.x - last[0],
            dy = point.y - last[1];
        const angle =
            (Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * Math.PI) / 4;
        const length = Math.hypot(dx, dy);
        return [
            last[0] + Math.cos(angle) * length,
            last[1] + Math.sin(angle) * length,
        ];
    }
    function repaintAll() {
        surface.reset(
            points.slice(1).map((point, index) => [points[index], point]),
            hover,
            brush,
        );
        surface.requestPaint();
    }
    function cancel() {
        const active = points.length > 0;
        points = [];
        hover = [];
        surface.clear();
        if (active) notify(0);
        return active;
    }
    function finish(close = false) {
        if (points.length < 2) {
            cancel();
            return;
        }
        const next = close ? [...points, points[0]] : points;
        if (!withinLimits(next)) {
            notice(
                'Path limit reached. Remove a point or finish an open path.',
            );
            return;
        }
        const object = createBoardDrawingObject(
            next,
            brush,
            false,
            graphics.store.getObjects().length,
        );
        if (graphics.insertDrawing(object)) cancel();
        else
            notice(
                'This path exceeds the Board limits. Its draft was retained.',
            );
    }
    return {
        add(point: BoardPoint, shift: boolean, nextBrush: BoardBrush) {
            const first = points[0];
            if (
                first &&
                points.length >= 3 &&
                Math.hypot(point.x - first[0], point.y - first[1]) *
                    stage.scaleX() <=
                    8
            ) {
                finish(true);
                return;
            }
            const next = snap(point, shift),
                last = points.at(-1);
            if (
                last &&
                Math.hypot(next[0] - last[0], next[1] - last[1]) *
                    stage.scaleX() <
                    3
            )
                return;
            if (!withinLimits([...points, next])) {
                notice(
                    'Path limit reached. Finish this path before starting another.',
                );
                return;
            }
            brush = { ...nextBrush };
            points.push(next);
            hover = [];
            surface.update(last ? [[last, next]] : [], [next], brush);
            notify(points.length);
            surface.requestPaint();
        },
        hover(point: BoardPoint | null, shift: boolean) {
            const last = points.at(-1);
            if (!last) return;
            hover = point ? [last, snap(point, shift)] : [last];
            surface.update([], hover, brush);
            surface.requestPaint();
        },
        setBrush(next: BoardBrush) {
            brush = { ...next };
            if (points.length) repaintAll();
        },
        finish: () => finish(),
        cancel,
        removeLastPoint() {
            if (!points.length) return false;
            points.pop();
            hover = [];
            if (!points.length) {
                surface.clear();
                notify(0);
            } else {
                repaintAll();
                notify(points.length);
            }
            return true;
        },
        recolor(color: string) {
            foreground = color;
            if (points.length) surface.requestPaint();
        },
        get active() {
            return points.length > 0;
        },
        dispose() {
            points = [];
            anchors.destroy();
        },
    };
}
