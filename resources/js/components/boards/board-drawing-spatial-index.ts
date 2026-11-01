// Summary: Filters eraser sweeps to nearby drawings before fragment allocation; depends on immutable gesture-start geometry and bounded uniform-grid membership.

import type { BoardObject, BoardPoint } from './board-types';

const cellSize = 256;
const maxCellsPerQuery = 256;

export class BoardDrawingSpatialIndex {
    private cells = new Map<string, BoardObject[]>();
    private largeDrawings: BoardObject[] = [];
    private drawings: BoardObject[];

    constructor(objects: BoardObject[]) {
        this.drawings = objects.filter(
            (object) => object.block_type === 'drawing' && object.data.drawing,
        );
        for (const object of this.drawings) {
            const drawing = object.data.drawing!;
            const padding =
                (drawing.stroke_width / 2) *
                Math.max(
                    object.width / drawing.view_width,
                    object.height / drawing.view_height,
                );
            const bounds = this.cellsFor(
                object.x - padding,
                object.y - padding,
                object.x + object.width + padding,
                object.y + object.height + padding,
            );
            //
            // A large stretched drawing stays in one overflow list instead of allocating thousands of duplicate grid references.
            //
            if (bounds.count > 64) {
                this.largeDrawings.push(object);
                continue;
            }
            this.visitCells(bounds, (key) => {
                const bucket = this.cells.get(key);
                if (bucket) bucket.push(object);
                else this.cells.set(key, [object]);
            });
        }
    }

    candidates(start: BoardPoint, end: BoardPoint, radius: number) {
        const bounds = this.cellsFor(
            Math.min(start.x, end.x) - radius,
            Math.min(start.y, end.y) - radius,
            Math.max(start.x, end.x) + radius,
            Math.max(start.y, end.y) + radius,
        );
        if (bounds.count > maxCellsPerQuery) return this.drawings;
        const candidates = new Set(this.largeDrawings);
        this.visitCells(bounds, (key) =>
            this.cells.get(key)?.forEach((object) => candidates.add(object)),
        );
        return candidates;
    }

    private cellsFor(left: number, top: number, right: number, bottom: number) {
        const x = Math.floor(left / cellSize);
        const y = Math.floor(top / cellSize);
        const maxX = Math.floor(right / cellSize);
        const maxY = Math.floor(bottom / cellSize);
        return { x, y, maxX, maxY, count: (maxX - x + 1) * (maxY - y + 1) };
    }

    private visitCells(
        bounds: ReturnType<BoardDrawingSpatialIndex['cellsFor']>,
        visit: (key: string) => void,
    ) {
        for (let x = bounds.x; x <= bounds.maxX; x++)
            for (let y = bounds.y; y <= bounds.maxY; y++) visit(`${x}:${y}`);
    }
}
