import { useState } from 'react';
import { intersects } from './board-geometry';
import type { BoardBounds, BoardObject } from './board-types';

const retainedOffscreenBudget = 48;

function retentionCost(object: BoardObject) {
    //
    // PDF canvases and linked Documents retain much more memory than text; a flat count would keep too many heavy surfaces alive.
    //
    if (object.block_type === 'file') return 12;
    if (object.block_type === 'resource') return 6;
    if (object.block_type === 'table' || object.block_type === 'mermaid')
        return 3;
    return 1;
}

export function useBoardRenderedObjects(
    objects: BoardObject[],
    visibleBounds: BoardBounds,
    editingId: string | null,
) {
    const [recentIds, setRecentIds] = useState<string[]>([]);
    const visibleIds = new Set(
        visibleBounds.width > 0 && visibleBounds.height > 0
            ? objects
                  .filter((object) => intersects(visibleBounds, object))
                  .map((object) => object.id)
            : [],
    );
    const objectsById = new Map(objects.map((object) => [object.id, object]));
    const retainedIds: string[] = [];
    let remainingBudget = retainedOffscreenBudget;
    for (const id of [...recentIds].reverse()) {
        const object = objectsById.get(id);
        if (!object || visibleIds.has(id)) continue;
        const cost = retentionCost(object);
        if (cost > remainingBudget) continue;
        retainedIds.push(id);
        remainingBudget -= cost;
    }
    const nextRecentIds = [...retainedIds.reverse(), ...visibleIds];
    //
    // Reversing a pan must reuse live rich surfaces instead of rebuilding editors, PDF canvases and diagram sessions at the culling edge.
    //
    if (
        nextRecentIds.length !== recentIds.length ||
        nextRecentIds.some((id, index) => id !== recentIds[index])
    )
        setRecentIds(nextRecentIds);
    const renderedIds = new Set(nextRecentIds);
    if (editingId) renderedIds.add(editingId);
    return objects.filter((object) => renderedIds.has(object.id));
}
