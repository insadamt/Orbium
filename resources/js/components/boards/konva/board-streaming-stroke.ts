// Summary: Freezes bounded smoothed stroke chunks and prepares only the live tail; depends on existing smoothing profiles, numeric persistence and the drawing point budget.

import {
    prepareBoardDrawingPoints,
    type BoardDrawingSmoothing,
} from '../board-drawing-smoothing';
import type { BoardPoint } from '../board-types';
import { boardDrawingPointLimit } from '../board-drawing-data';
import { appendBoardStrokePath } from './board-konva-geometry';
import type { BoardStrokePoint } from './board-graphics-bridge';

const chunkSamples = 64;

export class BoardStreamingStroke {
    readonly completedPath = new Path2D();
    private completedPoints: BoardStrokePoint[] = [];
    private consumed = 0;
    private tail: BoardStrokePoint[] = [];
    private revision = '';

    constructor(
        private smoothing: BoardDrawingSmoothing,
        private zoom: number,
        private onCompletedChunk?: (points: BoardStrokePoint[]) => void,
    ) {}

    prepare(points: BoardStrokePoint[], endpoint: BoardPoint | null) {
        const revision = `${points.length}:${endpoint?.x}:${endpoint?.y}`;
        if (revision === this.revision) return this.tail;
        this.revision = revision;
        while (points.length - this.consumed > chunkSamples) {
            const chunk = this.prepareChunk(
                points.slice(this.consumed, this.consumed + chunkSamples + 1),
                null,
            );
            appendBoardStrokePath(this.completedPath, chunk);
            this.onCompletedChunk?.(chunk);
            this.completedPoints.push(
                ...(this.completedPoints.length ? chunk.slice(1) : chunk),
            );
            this.consumed += chunkSamples;
        }
        this.tail = this.prepareChunk(
            points.slice(this.consumed),
            endpoint,
            Math.min(
                chunkSamples + 1,
                boardDrawingPointLimit -
                    this.completedPoints.length +
                    (this.completedPoints.length ? 1 : 0),
            ),
        );
        return this.tail;
    }

    finish() {
        return [
            ...this.completedPoints,
            ...(this.completedPoints.length ? this.tail.slice(1) : this.tail),
        ];
    }

    private prepareChunk(
        points: BoardStrokePoint[],
        endpoint: BoardPoint | null,
        pointLimit = chunkSamples + 1,
    ) {
        //
        // A chunk may not consume the next chunk's saved-point allowance; retain the same geometry in preview and the final commit.
        //
        return prepareBoardDrawingPoints({
            points,
            endpoint,
            smoothing: this.smoothing,
            zoom: this.zoom,
            pointLimit,
        });
    }
}
