import { useLayoutEffect, useMemo, useRef } from 'react';
import { intersects } from './board-geometry';
import type { BoardBounds, BoardObject } from './board-types';

const retainedOffscreenBudget = 48;
const noPinnedIds: readonly string[] = [];

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
    pinnedIds: readonly string[] = noPinnedIds,
) {
    const recentIds = useRef<string[]>([]);
    const result = useMemo(() => {
        const visibleIds = new Set(
            visibleBounds.width > 0 && visibleBounds.height > 0
                ? objects
                      .filter((object) => intersects(visibleBounds, object))
                      .map((object) => object.id)
                : [],
        );
        const objectsById = new Map(
            objects.map((object) => [object.id, object]),
        );
        const retainedIds: string[] = [];
        let remainingBudget = retainedOffscreenBudget;
        for (const id of [...recentIds.current].reverse()) {
            const object = objectsById.get(id);
            if (!object || visibleIds.has(id)) continue;
            const cost = retentionCost(object);
            if (cost > remainingBudget) continue;
            retainedIds.push(id);
            remainingBudget -= cost;
        }
        const nextRecentIds = [...retainedIds.reverse(), ...visibleIds];
        const renderedIds = new Set(nextRecentIds);
        if (editingId) renderedIds.add(editingId);
        for (const id of pinnedIds) renderedIds.add(id);
        return {
            recentIds: nextRecentIds,
            objects: objects.filter((object) => renderedIds.has(object.id)),
        };
    }, [objects, visibleBounds, editingId, pinnedIds]);
    //
    // Commit recency after React accepts the render; speculative renders must never publish state or change surface lifetime.
    //
    useLayoutEffect(() => {
        recentIds.current = result.recentIds;
    }, [result]);
    return result.objects;
}
