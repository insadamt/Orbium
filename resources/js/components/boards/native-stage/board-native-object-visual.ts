// Summary: Projects canonical drawing and all seven shape records into native graphical nodes; depends on shared paths and numeric fragments, preserving constant shape outlines and drawing view-box scaling.

import Konva from 'konva';
import { boardDrawingFragments } from '../board-drawing-data';
import { boardFragmentsPath } from '../konva/board-konva-geometry';
import { boardShapePath, boardShapeRenderedPath } from '../board-shape-data';
import type { BoardObject } from '../board-types';

export function createNativeObjectVisual(
    group: Konva.Group,
    initial: BoardObject,
    initialColor: string,
) {
    const hitFrame = new Konva.Rect({
        fill: '#000000',
        opacity: 0,
        name: 'object-hit-frame',
    });
    group.add(hitFrame);
    let object = initial;
    let foreground = initialColor;
    let drawingData = initial.data.drawing;
    let path = drawingData
        ? boardFragmentsPath(boardDrawingFragments(drawingData))
        : new Path2D();
    const drawingNode = drawingData
        ? new Konva.Shape({
              listening: false,
              perfectDrawEnabled: false,
              sceneFunc(context) {
                  const drawing = object.data.drawing!;
                  const native = context._context;
                  native.beginPath();
                  native.rect(0, 0, drawing.view_width, drawing.view_height);
                  native.clip();
                  native.strokeStyle =
                      drawing.color === 'currentColor'
                          ? foreground
                          : drawing.color;
                  native.lineWidth = drawing.stroke_width;
                  native.lineCap = 'round';
                  native.lineJoin = 'round';
                  native.stroke(path);
              },
          })
        : null;
    let shapePath = new Path2D();
    let vector: Konva.Shape | null = drawingNode;
    let vectorKind = '';
    if (drawingNode) group.add(drawingNode);

    function update(next: BoardObject) {
        const previous = object;
        object = next;
        hitFrame.size({ width: next.width, height: next.height });
        group.position({ x: next.x, y: next.y });
        group.scale({ x: 1, y: 1 });
        const drawing = next.data.drawing;
        if (drawing && drawingNode) {
            if (drawingData !== drawing) {
                path = boardFragmentsPath(boardDrawingFragments(drawing));
                drawingData = drawing;
            }
            drawingNode.scale({
                x: next.width / drawing.view_width,
                y: next.height / drawing.view_height,
            });
            drawingNode.opacity(drawing.opacity);
            if (previous.data !== next.data)
                drawingNode.getLayer()?.batchDraw();
            return;
        }
        const shape = next.data.shape!;
        const width = Math.max(1, next.width - 14);
        const height = Math.max(1, next.height - 14);
        const plainRectangle =
            shape.kind === 'rectangle' && !shape.corner_radius;
        const kind = plainRectangle
            ? 'rect'
            : ['circle', 'ellipse'].includes(shape.kind)
              ? 'ellipse'
              : ['diamond', 'hexagon'].includes(shape.kind) ||
                  (shape.kind === 'triangle' && !shape.corner_radius)
                ? 'polygon'
                : 'path';
        if (kind !== vectorKind) {
            vector?.destroy();
            vector =
                kind === 'rect'
                    ? new Konva.Rect()
                    : kind === 'ellipse'
                      ? new Konva.Ellipse()
                      : kind === 'polygon'
                        ? new Konva.Line({ closed: true })
                        : new Konva.Shape({
                              sceneFunc(context) {
                                  const appearance = object.data.shape!;
                                  const native = context._context;
                                  native.lineJoin = 'round';
                                  native.fillStyle =
                                      appearance.fill === 'currentColor'
                                          ? foreground
                                          : appearance.fill;
                                  if (appearance.fill !== 'none')
                                      native.fill(shapePath);
                                  native.strokeStyle =
                                      appearance.stroke === 'currentColor'
                                          ? foreground
                                          : appearance.stroke;
                                  native.lineWidth = appearance.stroke_width;
                                  native.setLineDash(
                                      appearance.stroke_style === 'dashed'
                                          ? [
                                                appearance.stroke_width * 4,
                                                appearance.stroke_width * 3,
                                            ]
                                          : [],
                                  );
                                  native.stroke(shapePath);
                              },
                          });
            vector.setAttrs({ listening: false, perfectDrawEnabled: false });
            group.add(vector);
            vectorKind = kind;
        }
        const color = (value: string) =>
            value === 'currentColor' ? foreground : value;
        vector!.setAttrs({
            x: 7,
            y: 7,
            scaleX: 1,
            scaleY: 1,
            fill: shape.fill === 'none' ? undefined : color(shape.fill),
            stroke: color(shape.stroke),
            strokeWidth: shape.stroke_width,
            dash:
                shape.stroke_style === 'dashed'
                    ? [shape.stroke_width * 4, shape.stroke_width * 3]
                    : [],
            lineJoin: 'round',
        });
        if (vector instanceof Konva.Rect) vector.size({ width, height });
        else if (vector instanceof Konva.Ellipse) {
            const sourceWidth = Math.max(1, next.width - 12);
            const sourceHeight = Math.max(1, next.height - 12);
            const radius = Math.min(sourceWidth, sourceHeight) / 2;
            const radiusX =
                shape.kind === 'circle'
                    ? (radius * width) / sourceWidth
                    : width / 2;
            vector.setAttrs({
                x: next.width / 2,
                y: next.height / 2,
                radiusX,
                radiusY:
                    shape.kind === 'circle'
                        ? (radius * height) / sourceHeight
                        : height / 2,
            });
        } else if (vector instanceof Konva.Line) {
            vector.points(
                shape.kind === 'triangle'
                    ? [width / 2, 0, width, height, 0, height]
                    : shape.kind === 'diamond'
                      ? [
                            width / 2,
                            0,
                            width,
                            height / 2,
                            width / 2,
                            height,
                            0,
                            height / 2,
                        ]
                      : [
                            width / 4,
                            0,
                            (width * 3) / 4,
                            0,
                            width,
                            height / 2,
                            (width * 3) / 4,
                            height,
                            width / 4,
                            height,
                            0,
                            height / 2,
                        ],
            );
        } else {
            const custom =
                ['rectangle', 'triangle'].includes(shape.kind) ||
                (shape.kind === 'rounded_rectangle' &&
                    shape.corner_radius !== undefined);
            //
            // Bake the shared SVG geometry into object units so nonuniform resizing never stretches the outline width.
            //
            const sourceWidth = custom ? Math.max(1, next.width - 12) : 100;
            const sourceHeight = custom ? Math.max(1, next.height - 12) : 100;
            const source = new Path2D(
                custom
                    ? boardShapeRenderedPath(shape, sourceWidth, sourceHeight)
                    : boardShapePath(shape.kind),
            );
            shapePath = new Path2D();
            shapePath.addPath(
                source,
                new DOMMatrix().scale(
                    width / sourceWidth,
                    height / sourceHeight,
                ),
            );
        }
    }

    return {
        update,
        recolor(color: string) {
            foreground = color;
            update(object);
        },
        replaceFragments(fragments: [number, number][][] | null) {
            if (!drawingNode || !object.data.drawing) return;
            path = boardFragmentsPath(
                fragments ?? boardDrawingFragments(object.data.drawing),
            );
            drawingNode.getLayer()?.batchDraw();
        },
    };
}

export type NativeObjectVisual = ReturnType<typeof createNativeObjectVisual>;
