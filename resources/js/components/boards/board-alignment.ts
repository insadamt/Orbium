import { clamp, enclosingBounds, snapped } from './board-geometry';
import {
    boardLimits,
    type BoardBounds,
    type BoardObject,
    type BoardPoint,
} from './board-types';

export type BoardGuide = {
    axis: 'x' | 'y';
    position: number;
    from: number;
    to: number;
};

type AlignmentMatch = {
    correction: number;
    position: number;
    target: BoardBounds;
};
function nearestAlignment(
    moving: BoardBounds,
    targets: BoardBounds[],
    axis: 'x' | 'y',
    tolerance: number,
): AlignmentMatch | null {
    const size = axis === 'x' ? 'width' : 'height';
    const anchors = [
        moving[axis],
        moving[axis] + moving[size] / 2,
        moving[axis] + moving[size],
    ];
    let match: AlignmentMatch | null = null;
    for (const target of targets) {
        for (const position of [
            target[axis],
            target[axis] + target[size] / 2,
            target[axis] + target[size],
        ]) {
            for (const anchor of anchors) {
                const correction = position - anchor;
                if (
                    Math.abs(correction) <= tolerance &&
                    (!match ||
                        Math.abs(correction) < Math.abs(match.correction))
                )
                    match = { correction, position, target };
            }
        }
    }
    return match;
}

export function resolveBoardMove({
    originals,
    objects,
    delta,
    zoom,
    snapToGrid,
    smartGuides,
    bypassSnap,
}: {
    originals: BoardObject[];
    objects: BoardObject[];
    delta: BoardPoint;
    zoom: number;
    snapToGrid: boolean;
    smartGuides: boolean;
    bypassSnap: boolean;
}): { objects: BoardObject[]; guides: BoardGuide[] } {
    const anchor = originals[0];
    const bounds = enclosingBounds(originals);
    if (!anchor || !bounds) return { objects: originals, guides: [] };
    const movement = {
        x: snapped(anchor.x + delta.x, snapToGrid && !bypassSnap) - anchor.x,
        y: snapped(anchor.y + delta.y, snapToGrid && !bypassSnap) - anchor.y,
    };
    const selected = new Set(originals.map((object) => object.id));
    const targets =
        smartGuides && !bypassSnap
            ? objects.filter((object) => !selected.has(object.id))
            : [];
    const moving = {
        ...bounds,
        x: bounds.x + movement.x,
        y: bounds.y + movement.y,
    };
    const matches = {
        x: nearestAlignment(moving, targets, 'x', 6 / zoom),
        y: nearestAlignment(moving, targets, 'y', 6 / zoom),
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
