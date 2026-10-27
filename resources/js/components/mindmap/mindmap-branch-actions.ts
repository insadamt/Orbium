import { mindMapDescendants, type MindMapData } from './mindmap-data';

export type BranchDrop = {
    sourceId: string;
    targetId: string;
    position: 'before' | 'inside' | 'after';
    axis: 'x' | 'y';
};
export function moveMindMapBranch(
    map: MindMapData,
    drop: BranchDrop,
): MindMapData | null {
    const source = map.topics.find((topic) => topic.id === drop.sourceId);
    const target = map.topics.find((topic) => topic.id === drop.targetId);
    if (!source || !target || source.id === map.root_id) return null;
    const descendants = mindMapDescendants(map, source.id);
    const parentId = drop.position === 'inside' ? target.id : target.parent_id;
    if (
        parentId === null ||
        descendants.has(target.id) ||
        descendants.has(parentId)
    )
        return null;
    const topics = map.topics.filter((topic) => topic.id !== source.id);
    let index = topics.findIndex((topic) => topic.id === target.id);
    if (drop.position === 'after') index += 1;
    if (drop.position === 'inside') {
        const children = topics.filter((topic) => topic.parent_id === parentId);
        const last = children.at(-1);
        index = last
            ? topics.findIndex((topic) => topic.id === last.id) + 1
            : index + 1;
    }
    topics.splice(index, 0, { ...source, parent_id: parentId });
    const ancestors = new Set<string>();
    let ancestor = topics.find((topic) => topic.id === parentId);
    while (ancestor && !ancestors.has(ancestor.id)) {
        ancestors.add(ancestor.id);
        ancestor = topics.find((topic) => topic.id === ancestor!.parent_id);
    }
    const next = {
        ...map,
        topics: topics.map((topic) =>
            ancestors.has(topic.id) ? { ...topic, collapsed: false } : topic,
        ),
    };
    const previousSiblings = map.topics
        .filter((topic) => topic.parent_id === parentId)
        .map((topic) => topic.id)
        .join(',');
    const nextSiblings = next.topics
        .filter((topic) => topic.parent_id === parentId)
        .map((topic) => topic.id)
        .join(',');
    const previousById = new Map(map.topics.map((topic) => [topic.id, topic]));
    return source.parent_id === parentId &&
        previousSiblings === nextSiblings &&
        next.topics.every(
            (topic) =>
                topic.collapsed === previousById.get(topic.id)?.collapsed,
        )
        ? null
        : next;
}
export function reorderMindMapSibling(
    map: MindMapData,
    id: string,
    offset: number,
): MindMapData | null {
    const source = map.topics.find((topic) => topic.id === id);
    if (!source || source.parent_id === null) return null;
    const siblings = map.topics.filter(
        (topic) => topic.parent_id === source.parent_id,
    );
    const target =
        siblings[siblings.findIndex((topic) => topic.id === id) + offset];
    return target
        ? moveMindMapBranch(map, {
              sourceId: id,
              targetId: target.id,
              position: offset < 0 ? 'before' : 'after',
              axis: 'y',
          })
        : null;
}
export function setMindMapVisibleLevels(
    map: MindMapData,
    levels: number | null,
): MindMapData {
    const byId = new Map(map.topics.map((topic) => [topic.id, topic]));
    return {
        ...map,
        topics: map.topics.map((topic) => {
            let depth = 0;
            let parent = topic.parent_id;
            while (parent !== null) {
                depth += 1;
                parent = byId.get(parent)?.parent_id ?? null;
            }
            return {
                ...topic,
                collapsed: levels !== null && depth >= levels - 1,
            };
        }),
    };
}

export function mindMapLevelCount(map: MindMapData): number {
    const parents = new Map(
        map.topics.map((topic) => [topic.id, topic.parent_id]),
    );
    let maximum = 1;
    for (const topic of map.topics) {
        let levels = 1,
            parent = topic.parent_id;
        while (parent !== null) {
            levels += 1;
            parent = parents.get(parent) ?? null;
        }
        maximum = Math.max(maximum, levels);
    }
    return maximum;
}
