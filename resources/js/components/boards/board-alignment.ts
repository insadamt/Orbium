import {
    indexBoardAlignmentTargets,
    nearestIndexedAlignment,
    type BoardAlignmentIndex,
} from './board-alignment-index';
import { clamp, enclosingBounds, snapped } from './board-geometry';
import { boardLimits, type BoardObject, type BoardPoint } from './board-types';

export type BoardGuide = {
    axis: 'x' | 'y';
    position: number;
    from: number;
    to: number;
};

export function resolveBoardMove({
    originals,
    objects,
    delta,
    zoom,
    snapToGrid,
    smartGuides,
    bypassSnap,
    alignmentIndex,
}: {
    originals: BoardObject[];
    objects: BoardObject[];
    delta: BoardPoint;
    zoom: number;
    snapToGrid: boolean;
    smartGuides: boolean;
    bypassSnap: boolean;
    alignmentIndex?: BoardAlignmentIndex;
}): { objects: BoardObject[]; guides: BoardGuide[] } {
    const anchor = originals[0];
    const bounds = enclosingBounds(originals);
    if (!anchor || !bounds) return { objects: originals, guides: [] };
    const movement = {
        x: snapped(anchor.x + delta.x, snapToGrid && !bypassSnap) - anchor.x,
        y: snapped(anchor.y + delta.y, snapToGrid && !bypassSnap) - anchor.y,
    };
    const targets =
        smartGuides && !bypassSnap
            ? (alignmentIndex ?? indexBoardAlignmentTargets(objects, originals))
            : { x: [], y: [] };
    const moving = {
        ...bounds,
        x: bounds.x + movement.x,
        y: bounds.y + movement.y,
    };
    const matches = {
        x: nearestIndexedAlignment(moving, targets.x, 'x', 6 / zoom),
        y: nearestIndexedAlignment(moving, targets.y, 'y', 6 / zoom),
    };
    const guides: BoardGuide[] = [];
    const alignedAxes: ('x' | 'y')[] = [];
    for (const axis of ['x', 'y'] as const) {
        const match = matches[axis];
        const requested = movement[axis] + (match?.correction ?? 0);
        movement[axis] = clamp(
            requested,
            Math.max(
                ...originals.map(
                    (object) => -boardLimits.coordinate - object[axis],
                ),
            ),
            Math.min(
                ...originals.map(
                    (object) => boardLimits.coordinate - object[axis],
                ),
            ),
        );
        if (match && Math.abs(movement[axis] - requested) < 0.001)
            alignedAxes.push(axis);
    }
    for (const axis of alignedAxes) {
        const match = matches[axis];
        if (match) {
            const cross = axis === 'x' ? 'y' : 'x';
            const size = axis === 'x' ? 'height' : 'width';
            guides.push({
                axis,
                position: match.position,
                from:
                    Math.min(
                        bounds[cross] + movement[cross],
                        match.target[cross],
                    ) -
                    16 / zoom,
                to:
                    Math.max(
                        bounds[cross] + movement[cross] + bounds[size],
                        match.target[cross] + match.target[size],
                    ) +
                    16 / zoom,
            });
        }
    }
    return {
        objects: originals.map((object) => ({
            ...object,
            x: object.x + movement.x,
            y: object.y + movement.y,
        })),
        guides,
    };
}
