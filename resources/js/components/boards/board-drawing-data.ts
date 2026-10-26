import {
    boardLimits,
    type BoardDrawing,
    type BoardDrawingTool,
    type BoardObject,
} from './board-types';

export const boardDrawingPointLimit = 6000;
export type BoardBrush = { color: string; width: number };

export function isBoardDrawingTool(tool: string): tool is BoardDrawingTool {
    return ['pen', 'path', 'highlighter', 'eraser'].includes(tool);
}

export function validBoardDrawing(value: unknown): value is BoardDrawing {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        return false;
    const drawing = value as BoardDrawing;
    return (
        Object.keys(drawing).length ===
            (Object.hasOwn(drawing, 'breaks') ? 7 : 6) &&
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
        (!Object.hasOwn(drawing, 'breaks') ||
            (Array.isArray(drawing.breaks) &&
                drawing.breaks.length >= 1 &&
                drawing.breaks.length < drawing.points.length &&
                drawing.breaks.every(
                    (index, position, indices) =>
                        Number.isInteger(index) &&
                        index > 0 &&
                        index < drawing.points.length &&
                        (position === 0 || index > indices[position - 1]),
                ))) &&
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

export function boardDrawingFragments(
    drawing: BoardDrawing,
): [number, number][][] {
    const boundaries = [0, ...(drawing.breaks ?? []), drawing.points.length];
    return boundaries
        .slice(1)
        .map((end, index) => drawing.points.slice(boundaries[index], end));
}

export function boardDrawingStrokePath(drawing: BoardDrawing) {
    return boardDrawingFragments(drawing).map(boardDrawingPath).join('');
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
