// Summary: Adapts existing editable drawing/shape geometry into disposable Konva nodes; depends on canonical numeric fragments, shared shape paths and native theme color.

import Konva from 'konva';
import { boardDrawingFragments } from '../board-drawing-data';
import { boardShapePath, boardShapeRenderedPath } from '../board-shape-data';
import type { BoardObject } from '../board-types';
import type { BoardStrokePoint } from './board-graphics-bridge';

export function appendBoardStrokePath(
    path: Path2D,
    points: BoardStrokePoint[],
) {
    if (!points.length) return;
    path.moveTo(...points[0]);
    for (let index = 1; index < points.length; index++)
        path.lineTo(...points[index]);
    if (points.length === 1) path.lineTo(points[0][0] + 0.01, points[0][1]);
}

export function boardFragmentsPath(fragments: BoardStrokePoint[][]) {
    const path = new Path2D();
    for (const points of fragments) appendBoardStrokePath(path, points);
    return path;
}

export function createBoardGraphic(object: BoardObject, foreground: string) {
    const drawing = object.data.drawing;
    const shape = object.data.shape;
    let path = drawing
        ? boardFragmentsPath(boardDrawingFragments(drawing))
        : new Path2D();
    let color = foreground;
    let strokeColor = drawing?.color ?? 'currentColor';
    let strokeWidth = drawing?.stroke_width ?? 1;
    let currentGeometry = object;
    const node = new Konva.Shape({
        id: object.id,
        listening: false,
        perfectDrawEnabled: false,
        sceneFunc(context) {
            const native = context._context;
            if (drawing) {
                native.beginPath();
                native.rect(0, 0, drawing.view_width, drawing.view_height);
                native.clip();
                native.strokeStyle =
                    strokeColor === 'currentColor' ? color : strokeColor;
                native.lineWidth = strokeWidth;
                native.lineCap = 'round';
                native.lineJoin = 'round';
                native.stroke(path);
                return;
            }
            if (!shape) return;
            native.lineJoin = 'round';
            native.fillStyle =
                shape.fill === 'currentColor' ? color : shape.fill;
            if (shape.fill !== 'none') native.fill(path);
            native.strokeStyle =
                shape.stroke === 'currentColor' ? color : shape.stroke;
            //
            // The path is already in object units, matching SVG non-scaling-stroke under nonuniform object resizing.
            //
            native.lineWidth = shape.stroke_width;
            native.setLineDash(
                shape.stroke_style === 'dashed'
                    ? [shape.stroke_width * 4, shape.stroke_width * 3]
                    : [],
            );
            native.stroke(path);
        },
    });
    function updateGeometry(geometry: BoardObject) {
        currentGeometry = geometry;
        node.position({ x: geometry.x, y: geometry.y });
        if (drawing) {
            node.scale({
                x: geometry.width / drawing.view_width,
                y: geometry.height / drawing.view_height,
            });
            node.opacity(drawing.opacity);
        } else if (shape) {
            //
            // A shape card has a one-pixel border before the six-pixel vector inset; reproduce its actual inner viewport.
            //
            const width = Math.max(1, geometry.width - 14);
            const height = Math.max(1, geometry.height - 14);
            const custom =
                ['rectangle', 'circle', 'triangle'].includes(shape.kind) ||
                (shape.kind === 'rounded_rectangle' &&
                    shape.corner_radius !== undefined);
            const dataWidth = Math.max(1, geometry.width - 12);
            const dataHeight = Math.max(1, geometry.height - 12);
            const source = new Path2D(
                custom
                    ? boardShapeRenderedPath(shape, dataWidth, dataHeight)
                    : boardShapePath(shape.kind),
            );
            path = new Path2D();
            path.addPath(
                source,
                new DOMMatrix().scale(
                    width / (custom ? dataWidth : 100),
                    height / (custom ? dataHeight : 100),
                ),
            );
            node.position({ x: geometry.x + 7, y: geometry.y + 7 });
        }
    }
    updateGeometry(object);
    return {
        node,
        object,
        updateGeometry,
        readGeometry: () => currentGeometry,
        updateAppearance: (appearance: { color: string; width: number }) => {
            strokeColor = appearance.color;
            strokeWidth = appearance.width;
        },
        readAppearance: () => ({
            color: strokeColor === 'currentColor' ? color : strokeColor,
            width: strokeWidth,
        }),
        finishAppearance: () => {
            strokeColor = drawing?.color ?? 'currentColor';
            strokeWidth = drawing?.stroke_width ?? 1;
        },
        updateColor: (value: string) => {
            color = value;
        },
        replaceFragments: (fragments: BoardStrokePoint[][] | null) => {
            if (drawing)
                path = boardFragmentsPath(
                    fragments ?? boardDrawingFragments(drawing),
                );
        },
    };
}

export type BoardKonvaGraphic = ReturnType<typeof createBoardGraphic>;
