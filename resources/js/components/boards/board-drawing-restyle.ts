import { boardLimits, type BoardObject } from './board-types';

export type BoardDrawingStyleChange = {
    color?: string;
    strokeWidth?: number;
};

export function createRestyledBoardDrawing(
    object: BoardObject,
    change: BoardDrawingStyleChange,
): BoardObject | null {
    const drawing = object.data.drawing;
    if (object.block_type !== 'drawing' || !drawing) return null;
    const color = change.color ?? drawing.color;
    const strokeWidth = change.strokeWidth ?? drawing.stroke_width;
    if (
        !/^(currentColor|#[0-9a-fA-F]{6})$/.test(color) ||
        !Number.isFinite(strokeWidth) ||
        strokeWidth < 1 ||
        strokeWidth > 48
    )
        return null;
    if (color === drawing.color && strokeWidth === drawing.stroke_width)
        return object;
    if (strokeWidth === drawing.stroke_width)
        return {
            ...object,
            data: { ...object.data, drawing: { ...drawing, color } },
        };

    const xs = drawing.points.map(([x]) => x);
    const ys = drawing.points.map(([, y]) => y);
    const padding = strokeWidth / 2 + 2;
    const left = Math.max(0, padding - Math.min(...xs));
    const top = Math.max(0, padding - Math.min(...ys));
    const right = Math.max(0, Math.max(...xs) + padding - drawing.view_width);
    const bottom = Math.max(0, Math.max(...ys) + padding - drawing.view_height);
    const scaleX = object.width / drawing.view_width;
    const scaleY = object.height / drawing.view_height;
    const viewWidth = drawing.view_width + left + right;
    const viewHeight = drawing.view_height + top + bottom;
    const width = object.width + (left + right) * scaleX;
    const height = object.height + (top + bottom) * scaleY;
    const x = object.x - left * scaleX;
    const y = object.y - top * scaleY;
    if (
        Math.max(viewWidth, viewHeight, width, height) > boardLimits.maxSize ||
        Math.abs(x) > boardLimits.coordinate ||
        Math.abs(y) > boardLimits.coordinate
    )
        return null;
    //
    // Grow the frame and shift local points together so thicker caps stay visible without moving or stretching the ink.
    //
    return {
        ...object,
        x,
        y,
        width,
        height,
        data: {
            ...object.data,
            drawing: {
                ...drawing,
                color,
                stroke_width: strokeWidth,
                view_width: viewWidth,
                view_height: viewHeight,
                points:
                    left || top
                        ? drawing.points.map(([px, py]): [number, number] => [
                              px + left,
                              py + top,
                          ])
                        : drawing.points,
            },
        },
    };
}
