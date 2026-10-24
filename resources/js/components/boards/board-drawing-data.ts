import {
    boardLimits,
    type BoardDrawing,
    type BoardDrawingTool,
    type BoardObject,
    type BoardPoint,
} from './board-types';

export const boardDrawingPointLimit = 6000;
export type BoardBrush = { color: string; width: number };

export function isBoardDrawingTool(tool: string): tool is BoardDrawingTool {
    return ['pen', 'highlighter', 'eraser'].includes(tool);
}

export function validBoardDrawing(value: unknown): value is BoardDrawing {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        return false;
    const drawing = value as BoardDrawing;
    return (
        Object.keys(drawing).length === 6 &&
        ['view_width', 'view_height'].every((key) => {
            const size = drawing[key as 'view_width'];
            return (
                Number.isFinite(size) &&
                size >= 1 &&
                size <= boardLimits.maxSize
            );
        }) &&
        typeof drawing.color === 'string' &&
        /^(currentColor|#[0-9a-fA-F]{6})$/.test(drawing.color) &&
        Number.isFinite(drawing.stroke_width) &&
        drawing.stroke_width >= 1 &&
        drawing.stroke_width <= 48 &&
        [0.3, 1].includes(drawing.opacity) &&
        Array.isArray(drawing.points) &&
        drawing.points.length >= 1 &&
        drawing.points.length <= boardDrawingPointLimit &&
        drawing.points.every(
            (point) =>
                Array.isArray(point) &&
                point.length === 2 &&
                point.every(
                    (number, axis) =>
                        typeof number === 'number' &&
                        Number.isFinite(number) &&
                        number >= 0 &&
                        number <=
                            (axis === 0
                                ? drawing.view_width
                                : drawing.view_height),
                ),
        )
    );
}

export function boardDrawingPath(points: [number, number][]) {
    if (!points.length) return '';
    const first = points[0];
    //
    // A tiny segment gives a single tap the same round cap as a continuous stroke.
    //
    if (points.length === 1) return `M${first[0]} ${first[1]}l0.01 0`;
    return points
        .map(([x, y], index) => `${index ? 'L' : 'M'}${x} ${y}`)
        .join('');
}

export function createBoardDrawingObject(
    points: [number, number][],
    brush: BoardBrush,
    highlighter: boolean,
    layer: number,
): BoardObject {
    const strokeWidth = highlighter ? brush.width * 4 : brush.width;
    const padding = strokeWidth / 2 + 2;
    const left = Math.min(...points.map(([x]) => x)) - padding;
    const top = Math.min(...points.map(([, y]) => y)) - padding;
    const width = Math.max(
        boardLimits.minWidth,
        Math.max(...points.map(([x]) => x)) - left + padding,
    );
    const height = Math.max(
        boardLimits.minHeight,
        Math.max(...points.map(([, y]) => y)) - top + padding,
    );
    return {
        id: crypto.randomUUID(),
        block_type: 'drawing',
        content_format_version: 1,
        x: left,
        y: top,
        width,
        height,
        layer,
        data: {
            drawing: {
                points: points.map(([x, y]) => [
                    Math.round((x - left) * 100) / 100,
                    Math.round((y - top) * 100) / 100,
                ]),
                view_width: width,
                view_height: height,
                color: brush.color,
                stroke_width: strokeWidth,
                opacity: highlighter ? 0.3 : 1,
            },
        },
    };
}

function distanceToSegment(
    point: BoardPoint,
    start: BoardPoint,
    end: BoardPoint,
) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthSquared = dx * dx + dy * dy;
    const fraction = lengthSquared
        ? Math.max(
              0,
              Math.min(
                  1,
                  ((point.x - start.x) * dx + (point.y - start.y) * dy) /
                      lengthSquared,
              ),
          )
        : 0;
    return Math.hypot(
        point.x - start.x - fraction * dx,
        point.y - start.y - fraction * dy,
    );
}

export function boardEraserHitsStroke(
    object: BoardObject,
    start: BoardPoint,
    end: BoardPoint,
    radius: number,
) {
    const drawing = object.data.drawing;
    if (object.block_type !== 'drawing' || !drawing) return false;
    const margin =
        radius +
        (drawing.stroke_width / 2) *
            Math.max(
                object.width / drawing.view_width,
                object.height / drawing.view_height,
            );
    if (
        Math.max(start.x, end.x) + margin < object.x ||
        Math.min(start.x, end.x) - margin > object.x + object.width ||
        Math.max(start.y, end.y) + margin < object.y ||
        Math.min(start.y, end.y) - margin > object.y + object.height
    )
        return false;
    const worldPoint = ([x, y]: [number, number]) => ({
        x: object.x + (x / drawing.view_width) * object.width,
        y: object.y + (y / drawing.view_height) * object.height,
    });
    let previous = worldPoint(drawing.points[0]);
    for (const point of drawing.points) {
        const current = worldPoint(point);
        const cross = (a: BoardPoint, b: BoardPoint, c: BoardPoint) =>
            (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
        const crossing =
            cross(start, end, previous) * cross(start, end, current) < 0 &&
            cross(previous, current, start) * cross(previous, current, end) < 0;
        if (
            crossing ||
            Math.min(
                distanceToSegment(start, previous, current),
                distanceToSegment(end, previous, current),
                distanceToSegment(previous, start, end),
                distanceToSegment(current, start, end),
            ) <= margin
        )
            return true;
        previous = current;
    }
    return false;
}
