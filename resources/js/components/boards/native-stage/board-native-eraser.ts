// Summary: Applies existing swept-capsule erasure to spatially filtered drawing candidates and previews only dirty records; depends on canonical fragments and one atomic scratch history transaction.

import { BoardDrawingSpatialIndex } from '../board-drawing-spatial-index';
import {
    boardDrawingFragments,
    boardDrawingPointLimit,
} from '../board-drawing-data';
import {
    createErasedStrokeObject,
    eraseStrokeFragments,
    type ErasedStrokePreview,
} from '../board-eraser-geometry';
import type { BoardPoint } from '../board-types';
import type { NativeBoardGraphics } from './board-native-graphics';

export function createNativeEraser(
    graphics: NativeBoardGraphics,
    radius: number,
) {
    const objects = graphics.store.getObjects();
    const index = new BoardDrawingSpatialIndex(objects);
    const previews = new Map<string, ErasedStrokePreview>();
    const originals = new Map<string, [number, number][][]>();
    const dirty = new Set<string>();
    const metrics = { sweeps: 0, candidates: 0, changedDrawings: 0 };
    let pointCount = 0;
    let limited = false;
    const count = (fragments: [number, number][][]) =>
        fragments.reduce((total, points) => total + points.length, 0);

    return {
        metrics,
        sweep(start: BoardPoint, end: BoardPoint) {
            if (limited) return;
            metrics.sweeps++;
            for (const object of index.candidates(start, end, radius)) {
                metrics.candidates++;
                if (!originals.has(object.id))
                    originals.set(
                        object.id,
                        boardDrawingFragments(object.data.drawing!),
                    );
                const previous = previews.get(object.id);
                const preview = previous ?? {
                    original: object,
                    fragments: originals.get(object.id)!,
                };
                const fragments = eraseStrokeFragments(preview, {
                    start,
                    end,
                    radius,
                });
                if (!fragments) continue;
                const nextCount =
                    pointCount -
                    (previous ? count(previous.fragments) : 0) +
                    count(fragments);
                if (
                    nextCount > 120_000 ||
                    count(fragments) > boardDrawingPointLimit
                ) {
                    limited = true;
                    return;
                }
                pointCount = nextCount;
                previews.set(object.id, { original: object, fragments });
                dirty.add(object.id);
                metrics.changedDrawings++;
            }
        },
        paint() {
            for (const id of dirty)
                graphics.paintErasure(id, previews.get(id)!.fragments);
            dirty.clear();
        },
        restore() {
            for (const id of previews.keys()) graphics.paintErasure(id, null);
        },
        commit() {
            if (limited) return false;
            if (!previews.size) return true;
            const next = objects.flatMap((object) => {
                const preview = previews.get(object.id);
                if (!preview) return [object];
                const replacement = createErasedStrokeObject(preview);
                return replacement ? [replacement] : [];
            });
            return graphics.store.commitSnapshot(next);
        },
        get limited() {
            return limited;
        },
        get hasChanges() {
            return previews.size > 0;
        },
    };
}

export type NativeEraser = ReturnType<typeof createNativeEraser>;
