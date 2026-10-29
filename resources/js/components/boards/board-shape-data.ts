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
    'circle',
    'rectangle',
    'rounded_rectangle',
    'ellipse',
    'diamond',
    'triangle',
    'hexagon',
] as const;

// Only these three shapes are offered for new placement. Legacy kinds remain
// valid so older Boards continue to load and save unchanged.
export const boardInsertShapeKinds = ['circle', 'rectangle', 'triangle'] as const;

export function boardShapeDefaultSize(kind: BoardShapeKind) {
    return kind === 'circle' || kind === 'rectangle'
        ? { width: 200, height: 200 }
        : { width: 240, height: 160 };
}

export function boardShapeCornerRadius(shape: BoardShape): number {
    return shape.corner_radius ?? (shape.kind === 'rounded_rectangle' ? 10 : 0);
}

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
        ...(kind === 'rectangle' || kind === 'triangle'
            ? { corner_radius: 0 }
            : {}),
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
            ['kind', 'fill', 'stroke', 'stroke_width', 'stroke_style', 'corner_radius'].includes(
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
        (shape.corner_radius === undefined ||
            (Number.isFinite(shape.corner_radius) &&
                shape.corner_radius >= 0 &&
                shape.corner_radius <= 50)) &&
        validBoardInline(data.content) &&
        (data.align === undefined ||
            ['left', 'center', 'right'].includes(data.align)) &&
        (data.dir === undefined || ['auto', 'ltr', 'rtl'].includes(data.dir)),
    );
}

export function boardShapePath(kind: BoardShapeKind): string {
    switch (kind) {
        case 'circle':
            return 'M 100 50 A 50 50 0 1 1 0 50 A 50 50 0 1 1 100 50 Z';
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

// Geometry is built in the real (unscaled) SVG frame so corner radii
// stay circular on wide rectangles rather than stretching with the viewBox.
export function boardShapeRenderedPath(
    shape: BoardShape,
    width: number,
    height: number,
): string {
    const w = Math.max(1, width);
    const h = Math.max(1, height);
    const radius = (Math.min(w, h) * boardShapeCornerRadius(shape)) / 100;
    if (shape.kind === 'circle') {
        const r = Math.min(w, h) / 2;
        const cx = w / 2;
        const cy = h / 2;
        return `M ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} Z`;
    }
    if (shape.kind === 'rectangle' || shape.kind === 'rounded_rectangle') {
        if (radius === 0) return `M 0 0 H ${w} V ${h} H 0 Z`;
        return `M ${radius} 0 H ${w - radius} Q ${w} 0 ${w} ${radius} V ${h - radius} Q ${w} ${h} ${w - radius} ${h} H ${radius} Q 0 ${h} 0 ${h - radius} V ${radius} Q 0 0 ${radius} 0 Z`;
    }
    if (shape.kind === 'triangle') {
        const points = [
            { x: w / 2, y: 0 },
            { x: w, y: h },
            { x: 0, y: h },
        ];
        if (radius === 0) return `M ${w / 2} 0 L ${w} ${h} H 0 Z`;
        const corners = points.map((point, i) => {
            const prev = points[(i + 2) % 3];
            const next = points[(i + 1) % 3];
            const beforeLength = Math.hypot(prev.x - point.x, prev.y - point.y);
            const afterLength = Math.hypot(next.x - point.x, next.y - point.y);
            const cut = Math.min(radius, beforeLength / 2, afterLength / 2);
            return {
                vertex: point,
                incoming: {
                    x: point.x + ((prev.x - point.x) * cut) / beforeLength,
                    y: point.y + ((prev.y - point.y) * cut) / beforeLength,
                },
                outgoing: {
                    x: point.x + ((next.x - point.x) * cut) / afterLength,
                    y: point.y + ((next.y - point.y) * cut) / afterLength,
                },
            };
        });
        const format = (p: BoardPoint) => `${p.x} ${p.y}`;
        const [top, right, left] = corners;
        return `M ${format(top.outgoing)} L ${format(right.incoming)} Q ${format(right.vertex)} ${format(right.outgoing)} L ${format(left.incoming)} Q ${format(left.vertex)} ${format(left.outgoing)} L ${format(top.incoming)} Q ${format(top.vertex)} ${format(top.outgoing)} Z`;
    }
    return boardShapePath(shape.kind);
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
