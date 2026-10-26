import type { TopicDirection } from './mindmap-layout-types';
import type { MindMapData, MindMapTopic } from './mindmap-data';
export function mindMapExpandKey(
    map: MindMapData,
    direction: TopicDirection = 'right',
) {
    if (map.layout === 'outline') return 'ArrowRight';
    return {
        right: 'ArrowRight',
        left: 'ArrowLeft',
        up: 'ArrowUp',
        down: 'ArrowDown',
    }[direction];
}
export function mindMapNavigation(
    map: MindMapData,
    topic: MindMapTopic,
    key: string,
    direction: TopicDirection = 'right',
) {
    const outward = mindMapExpandKey(map, direction);
    const inward = {
        ArrowRight: 'ArrowLeft',
        ArrowLeft: 'ArrowRight',
        ArrowUp: 'ArrowDown',
        ArrowDown: 'ArrowUp',
    }[outward];
    const children = map.topics.filter(
        (candidate) => candidate.parent_id === topic.id,
    );
    if (key === inward) return topic.parent_id ?? topic.id;
    if (key === outward)
        return topic.collapsed ? topic.id : (children[0]?.id ?? topic.id);
    if (key === 'Home') return map.root_id;
    const siblings = map.topics.filter(
        (candidate) => candidate.parent_id === topic.parent_id,
    );
    const index = siblings.findIndex((candidate) => candidate.id === topic.id);
    const previous =
        outward === 'ArrowUp' || outward === 'ArrowDown'
            ? 'ArrowLeft'
            : 'ArrowUp';
    const next =
        outward === 'ArrowUp' || outward === 'ArrowDown'
            ? 'ArrowRight'
            : 'ArrowDown';
    if (key === previous)
        return siblings[Math.max(0, index - 1)]?.id ?? topic.id;
    if (key === next)
        return (
            siblings[Math.min(siblings.length - 1, index + 1)]?.id ?? topic.id
        );
    return null;
}

export function visibleMindMapTopic(map: MindMapData, selectedId: string) {
    const topics = new Map(map.topics.map((topic) => [topic.id, topic]));
    let selected = topics.get(selectedId) ?? topics.get(map.root_id);
    let ancestor = selected;
    const visited = new Set<string>();
    //
    // Owner history can restore a collapsed ancestor while its selected descendant still exists.
    //
    while (ancestor && !visited.has(ancestor.id)) {
        visited.add(ancestor.id);
        if (ancestor.id !== selectedId && ancestor.collapsed)
            selected = ancestor;
        ancestor =
            ancestor.parent_id === null
                ? undefined
                : topics.get(ancestor.parent_id);
    }
    return selected;
}
