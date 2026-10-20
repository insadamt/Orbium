import type { BoardBounds, BoardObject } from './board-types';

type AlignmentAnchor = {
    position: number;
    order: number;
    target: BoardBounds;
};
export type BoardAlignmentIndex = Record<'x' | 'y', AlignmentAnchor[]>;

export function indexBoardAlignmentTargets(
    objects: BoardObject[],
    originals: BoardObject[],
): BoardAlignmentIndex {
    const selected = new Set(originals.map((object) => object.id));
    const index: BoardAlignmentIndex = { x: [], y: [] };
    for (const axis of ['x', 'y'] as const) {
        const size = axis === 'x' ? 'width' : 'height';
        const positions = new Map<number, AlignmentAnchor>();
        for (const [objectIndex, target] of objects.entries()) {
            if (selected.has(target.id)) continue;
            for (const [anchorIndex, position] of [
                target[axis],
                target[axis] + target[size] / 2,
                target[axis] + target[size],
            ].entries()) {
                //
                // Equal anchors keep the original target order so overlapping blocks retain the previous guide choice.
                //
                if (!positions.has(position))
                    positions.set(position, {
                        position,
                        order: objectIndex * 3 + anchorIndex,
                        target,
                    });
            }
        }
        index[axis] = [...positions.values()].sort(
            (first, second) => first.position - second.position,
        );
    }
    return index;
}

export function nearestIndexedAlignment(
    moving: BoardBounds,
    targets: AlignmentAnchor[],
    axis: 'x' | 'y',
    tolerance: number,
) {
    const size = axis === 'x' ? 'width' : 'height';
    let match: (AlignmentAnchor & { correction: number }) | null = null;
    for (const anchor of [
        moving[axis],
        moving[axis] + moving[size] / 2,
        moving[axis] + moving[size],
    ]) {
        let low = 0;
        let high = targets.length;
        while (low < high) {
            const middle = Math.floor((low + high) / 2);
            if (targets[middle].position < anchor) low = middle + 1;
            else high = middle;
        }
        for (const candidate of [targets[low - 1], targets[low]]) {
            if (!candidate) continue;
            const correction = candidate.position - anchor;
            const distance = Math.abs(correction);
            if (
                distance <= tolerance &&
                (!match ||
                    distance < Math.abs(match.correction) ||
                    (distance === Math.abs(match.correction) &&
                        candidate.order < match.order))
            )
                match = { ...candidate, correction };
        }
    }
    return match;
}
