import type { MindMapTopic } from './mindmap-data';
export type TopicDirection = 'left' | 'right' | 'up' | 'down';
export type PlacedTopic = {
    topic: MindMapTopic;
    x: number;
    y: number;
    depth: number;
    side: number;
    direction: TopicDirection;
    children: number;
    height: number;
    width: number;
};
export type LayoutContext = {
    root: MindMapTopic;
    children: Map<string, MindMapTopic[]>;
    sizes: Map<string, { width: number; height: number }>;
};
export type TopicArrangement = { topics: PlacedTopic[]; paths: string[] };
export function visibleChildren(context: LayoutContext, topic: MindMapTopic) {
    return topic.collapsed ? [] : (context.children.get(topic.id) ?? []);
}
export function placedTopic(
    context: LayoutContext,
    topic: MindMapTopic,
    placement: {
        x: number;
        y: number;
        depth: number;
        direction: TopicDirection;
    },
): PlacedTopic {
    return {
        topic,
        ...placement,
        side: placement.direction === 'left' ? -1 : 1,
        children: context.children.get(topic.id)?.length ?? 0,
        ...context.sizes.get(topic.id)!,
    };
}
export function horizontalConnection(parent: PlacedTopic, child: PlacedTopic) {
    const fromX = parent.x + (child.side > 0 ? parent.width : 0);
    const toX = child.x + (child.side > 0 ? 0 : child.width);
    const fromY = parent.y + parent.height / 2;
    const toY = child.y + child.height / 2;
    const middle = (fromX + toX) / 2;
    return `M${fromX},${fromY} C${middle},${fromY} ${middle},${toY} ${toX},${toY}`;
}
export function verticalConnection(
    parent: PlacedTopic,
    child: PlacedTopic,
    direction: number,
) {
    const fromX = parent.x + parent.width / 2;
    const toX = child.x + child.width / 2;
    const fromY = parent.y + (direction > 0 ? parent.height : 0);
    const toY = child.y + (direction > 0 ? 0 : child.height);
    const middle = (fromY + toY) / 2;
    return `M${fromX},${fromY} V${middle} H${toX} V${toY}`;
}
export function arrangementBounds(topics: PlacedTopic[]) {
    return {
        left: Math.min(...topics.map((topic) => topic.x)),
        top: Math.min(...topics.map((topic) => topic.y)),
        right: Math.max(...topics.map((topic) => topic.x + topic.width)),
        bottom: Math.max(...topics.map((topic) => topic.y + topic.height)),
    };
}
