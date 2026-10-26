import type { MindMapData } from './mindmap-data';

export const mindMapTopicWidth = { default: 180, min: 100, max: 800 };

export function clampMindMapTopicWidth(width: number): number {
    return Math.round(
        Math.max(mindMapTopicWidth.min, Math.min(mindMapTopicWidth.max, width)),
    );
}

export function withMindMapTopicWidth(
    map: MindMapData,
    id: string,
    width: number,
): MindMapData {
    return {
        ...map,
        version: map.version >= 4 ? map.version : 3,
        topics: map.topics.map((topic) =>
            topic.id === id ? { ...topic, width } : topic,
        ),
    };
}
