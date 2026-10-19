import { clamp, enclosingBounds } from './board-geometry';
import { boardLimits, type BoardObject } from './board-types';

export const boardArrangementActions = [
    { action: 'left', label: 'Align left', minimum: 2 },
    { action: 'center', label: 'Align horizontal centers', minimum: 2 },
    { action: 'right', label: 'Align right', minimum: 2 },
    { action: 'top', label: 'Align top', minimum: 2 },
    { action: 'middle', label: 'Align vertical centers', minimum: 2 },
    { action: 'bottom', label: 'Align bottom', minimum: 2 },
    { action: 'horizontal', label: 'Distribute horizontally', minimum: 3 },
    { action: 'vertical', label: 'Distribute vertically', minimum: 3 },
] as const;
export type BoardArrangement =
    (typeof boardArrangementActions)[number]['action'];

export function arrangeBoardObjects(
    objects: BoardObject[],
    selectedIds: string[],
    action: BoardArrangement,
): BoardObject[] {
    const selected = objects.filter((object) =>
        selectedIds.includes(object.id),
    );
    const bounds = enclosingBounds(selected);
    const minimum = action === 'horizontal' || action === 'vertical' ? 3 : 2;
    if (!bounds || selected.length < minimum) return objects;
    const replacements = new Map<string, BoardObject>();
    if (action === 'horizontal' || action === 'vertical') {
        const axis = action === 'horizontal' ? 'x' : 'y';
        const size = axis === 'x' ? 'width' : 'height';
        const sorted = [...selected].sort(
            (first, second) => first[axis] - second[axis],
        );
        const gap =
            (bounds[size] -
                sorted.reduce((sum, object) => sum + object[size], 0)) /
            (sorted.length - 1);
        let position = bounds[axis];
        for (const object of sorted) {
            replacements.set(object.id, {
                ...object,
                [axis]: clamp(
                    position,
                    -boardLimits.coordinate,
                    boardLimits.coordinate,
                ),
            });
            position += object[size] + gap;
        }
    } else {
        for (const object of selected) {
            const x =
                action === 'left'
                    ? bounds.x
                    : action === 'center'
                      ? bounds.x + (bounds.width - object.width) / 2
                      : action === 'right'
                        ? bounds.x + bounds.width - object.width
                        : object.x;
            const y =
                action === 'top'
                    ? bounds.y
                    : action === 'middle'
                      ? bounds.y + (bounds.height - object.height) / 2
                      : action === 'bottom'
                        ? bounds.y + bounds.height - object.height
                        : object.y;
            replacements.set(object.id, {
                ...object,
                x: clamp(x, -boardLimits.coordinate, boardLimits.coordinate),
                y: clamp(y, -boardLimits.coordinate, boardLimits.coordinate),
            });
        }
    }
    if (
        selected.every((object) => {
            const next = replacements.get(object.id)!;
            return (
                Math.abs(next.x - object.x) < 0.001 &&
                Math.abs(next.y - object.y) < 0.001
            );
        })
    )
        return objects;
    return objects.map((object) => replacements.get(object.id) ?? object);
}
