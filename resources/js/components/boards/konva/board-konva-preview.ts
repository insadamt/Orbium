// Summary: Paints cached live ink and path tails independently of completed graphics; depends on gesture buffers, the shared camera and one disposable Konva plane.

import Konva from 'konva';
import type { BoardBrush } from '../board-drawing-data';
import type { BoardPoint } from '../board-types';
import { BoardKonvaSurface } from './board-konva-surface';
import {
    appendBoardStrokePath,
    boardFragmentsPath,
} from './board-konva-geometry';
import type {
    BoardStrokePoint,
    BoardStrokePreview,
} from './board-graphics-bridge';

export class BoardKonvaPreview {
    readonly surface: BoardKonvaSurface;
    private completed = new Path2D();
    private tail: BoardStrokePoint[] = [];
    private brush: BoardBrush = { color: 'currentColor', width: 3 };
    private foreground = '#000000';
    private pathPoints: BoardStrokePoint[] | null = null;

    constructor(world: HTMLElement) {
        this.surface = new BoardKonvaSurface(world);
        this.surface.host.style.zIndex = '1000002';
        this.surface.world.add(
            new Konva.Shape({
                listening: false,
                perfectDrawEnabled: false,
                sceneFunc: (context) => {
                    const native = context._context;
                    native.lineCap = 'round';
                    native.lineJoin = 'round';
                    native.lineWidth = this.brush.width;
                    native.strokeStyle =
                        this.brush.color === 'currentColor'
                            ? this.foreground
                            : this.brush.color;
                    native.stroke(this.completed);
                    const tail = new Path2D();
                    appendBoardStrokePath(tail, this.tail);
                    native.stroke(tail);
                },
            }),
        );
    }

    updateColor(foreground: string) {
        this.foreground = foreground;
        this.surface.dirty = true;
    }

    paintStroke(preview: BoardStrokePreview | null) {
        this.pathPoints = null;
        this.completed = preview?.completed ?? new Path2D();
        this.tail = preview?.tail ?? [];
        if (preview)
            this.brush = {
                ...preview.brush,
                width: preview.brush.width * (preview.highlighter ? 4 : 1),
            };
        //
        // Composite alpha once after opaque segments join, preserving highlighter opacity at chunk boundaries and self-crossings.
        //
        this.surface.host.style.opacity = preview?.highlighter ? '0.3' : '1';
        this.surface.dirty = true;
        this.surface.draw();
    }

    paintPath(
        points: BoardStrokePoint[],
        hover: BoardPoint | null,
        brush: BoardBrush,
    ) {
        if (points !== this.pathPoints) {
            this.completed = boardFragmentsPath([points]);
            this.pathPoints = points;
        }
        const last = points.at(-1);
        this.tail = last && hover ? [last, [hover.x, hover.y]] : [];
        this.brush = brush;
        this.surface.host.style.opacity = '1';
        this.surface.dirty = true;
        this.surface.draw();
    }

    destroy() {
        this.surface.destroy();
    }
}
