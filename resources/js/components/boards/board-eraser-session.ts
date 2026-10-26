import {
    boardDrawingPath,
    boardDrawingStrokePath,
    boardDrawingFragments,
    boardDrawingPointLimit,
} from './board-drawing-data';
import {
    createErasedStrokeObject,
    eraseStrokeFragments,
    type ErasedStrokePreview,
} from './board-eraser-geometry';
import type { BoardObject, BoardPoint } from './board-types';

export class BoardEraserSession {
    private previews = new Map<string, ErasedStrokePreview>();
    private paintedPaths = new Map<SVGPathElement, string>();
    private previewPointCount = 0;
    private dirtyIds = new Set<string>();
    limited = false;

    constructor(private radius: number) {}

    eraseSweep(objects: BoardObject[], start: BoardPoint, end: BoardPoint) {
        if (this.limited) return;
        for (const object of objects) {
            if (object.block_type !== 'drawing' || !object.data.drawing)
                continue;
            const previous = this.previews.get(object.id);
            const preview = previous ?? {
                original: object,
                fragments: boardDrawingFragments(object.data.drawing),
            };
            const fragments = eraseStrokeFragments(preview, {
                start,
                end,
                radius: this.radius,
            });
            if (!fragments) continue;
            const countPoints = (pieces: [number, number][][]) =>
                pieces.reduce((count, points) => count + points.length, 0);
            const nextPointCount =
                this.previewPointCount -
                (previous ? countPoints(previous.fragments) : 0) +
                countPoints(fragments);
            //
            // Refuse an oversized preview as one canceled gesture rather than allocating unbounded fragments before save validation.
            //
            if (
                nextPointCount > 120_000 ||
                countPoints(fragments) > boardDrawingPointLimit
            ) {
                this.limited = true;
                return;
            }
            this.previewPointCount = nextPointCount;
            this.previews.set(object.id, { original: object, fragments });
            this.dirtyIds.add(object.id);
        }
    }

    paintPreview(viewport: HTMLElement | null) {
        if (!viewport) return;
        for (const id of this.dirtyIds) {
            const { original, fragments } = this.previews.get(id)!;
            const path = viewport.querySelector<SVGPathElement>(
                `[data-board-object-id="${original.id}"] .board-drawing-stroke path`,
            );
            if (!path) continue;
            if (!this.paintedPaths.has(path))
                this.paintedPaths.set(
                    path,
                    boardDrawingStrokePath(original.data.drawing!),
                );
            path.setAttribute('d', fragments.map(boardDrawingPath).join(''));
        }
        this.dirtyIds.clear();
    }

    restorePreview() {
        for (const [path, originalPath] of this.paintedPaths)
            path.setAttribute('d', originalPath);
        this.paintedPaths.clear();
    }

    createObjects(objects: BoardObject[]) {
        if (!this.previews.size) return null;
        return objects
            .flatMap((object) => {
                const preview = this.previews.get(object.id);
                if (!preview) return [object];
                const replacement = createErasedStrokeObject(preview);
                return replacement ? [replacement] : [];
            })
            .map((object, layer) =>
                object.layer === layer ? object : { ...object, layer },
            );
    }
}

export function boardEraserCursor(diameter: number) {
    const size = diameter + 4;
    const center = size / 2;
    const circle = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${center}" cy="${center}" r="${diameter / 2}" fill="none" stroke="white" stroke-width="3"/><circle cx="${center}" cy="${center}" r="${diameter / 2}" fill="none" stroke="black" stroke-width="1"/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(circle)}") ${center} ${center}, crosshair`;
}
