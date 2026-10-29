// Summary: Defines validated native shape geometry and defaults, shared by placement, SVG rendering and Board record validation.

import { clamp } from './board-geometry';
import { validBoardInline } from './board-inline-data';
import {
    boardLimits,
    type BoardBlockData,
    type BoardBounds,
    type BoardPoint,
    type BoardShape,
    type BoardShapeKind,
    type BoardTool,
} from './board-types';

export const boardShapeKinds = [
    'rectangle',
    'rounded_rectangle',
    'ellipse',
    'diamond',
    'triangle',
    'hexagon',
] as const;

export function isBoardShapeTool(tool: BoardTool): tool is BoardShapeKind {
    return (boardShapeKinds as readonly string[]).includes(tool);
}

export function defaultBoardShape(kind: BoardShapeKind): BoardShape {
    return {
        kind,
        fill: 'none',
        stroke: 'currentColor',
        stroke_width: 2,
        stroke_style: 'solid',
    };
}

export function validBoardShapeData(data: BoardBlockData) {
    const shape = data.shape;
    const color = /^(?:currentColor|#[0-9a-fA-F]{6})$/;
    return Boolean(
        shape &&
        typeof shape === 'object' &&
        !Array.isArray(shape) &&
        Object.keys(data).every((key) =>
            ['shape', 'content', 'align', 'dir', 'text_scale'].includes(key),
        ) &&
        Object.keys(shape).every((key) =>
            ['kind', 'fill', 'stroke', 'stroke_width', 'stroke_style'].includes(
                key,
            ),
        ) &&
        boardShapeKinds.includes(shape.kind) &&
        typeof shape.fill === 'string' &&
        (shape.fill === 'none' || color.test(shape.fill)) &&
        typeof shape.stroke === 'string' &&
        color.test(shape.stroke) &&
        Number.isFinite(shape.stroke_width) &&
        shape.stroke_width >= 1 &&
        shape.stroke_width <= 12 &&
        ['solid', 'dashed'].includes(shape.stroke_style) &&
        validBoardInline(data.content) &&
        (data.align === undefined ||
            ['left', 'center', 'right'].includes(data.align)) &&
        (data.dir === undefined || ['auto', 'ltr', 'rtl'].includes(data.dir)),
    );
}

export function boardShapePath(kind: BoardShapeKind): string {
    switch (kind) {
        case 'rectangle':
            return 'M 0 0 H 100 V 100 H 0 Z';
        case 'rounded_rectangle':
            return 'M 10 0 H 90 Q 100 0 100 10 V 90 Q 100 100 90 100 H 10 Q 0 100 0 90 V 10 Q 0 0 10 0 Z';
        case 'ellipse':
            return 'M 100 50 A 50 50 0 1 1 0 50 A 50 50 0 1 1 100 50 Z';
        case 'diamond':
            return 'M 50 0 L 100 50 L 50 100 L 0 50 Z';
        case 'triangle':
            return 'M 50 0 L 100 100 H 0 Z';
        case 'hexagon':
            return 'M 25 0 H 75 L 100 50 L 75 100 H 25 L 0 50 Z';
    }
}

export function boardShapePlacementBounds(
    start: BoardPoint,
    end: BoardPoint,
    equalSides: boolean,
): BoardBounds {
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    const side = clamp(
        Math.max(Math.abs(deltaX), Math.abs(deltaY)),
        boardLimits.minWidth,
        boardLimits.maxSize,
    );
    const width = equalSides
        ? side
        : clamp(Math.abs(deltaX), boardLimits.minWidth, boardLimits.maxSize);
    const height = equalSides
        ? side
        : clamp(Math.abs(deltaY), boardLimits.minHeight, boardLimits.maxSize);
    return {
        x: clamp(
            deltaX < 0 ? start.x - width : start.x,
            -boardLimits.coordinate,
            boardLimits.coordinate,
        ),
        y: clamp(
            deltaY < 0 ? start.y - height : start.y,
            -boardLimits.coordinate,
            boardLimits.coordinate,
        ),
        width,
        height,
    };
}
