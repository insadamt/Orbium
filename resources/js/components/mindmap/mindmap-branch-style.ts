import iconData from '@/components/inline-icons/data/icons.json';
import type { MindMapData, MindMapTopic } from './mindmap-data';
export const branchColors = {
    gray: '#64748b',
    red: '#ef4444',
    orange: '#f97316',
    amber: '#eab308',
    green: '#22c55e',
    teal: '#14b8a6',
    blue: '#3b82f6',
    purple: '#a855f7',
    pink: '#ec4899',
} as const;
export type BranchColor = keyof typeof branchColors;
export function validBranchColor(value: unknown): value is BranchColor {
    return typeof value === 'string' && Object.hasOwn(branchColors, value);
}
export function validBranchIcon(value: unknown): value is string {
    return typeof value === 'string' && Object.hasOwn(iconData, value);
}
export function mindMapBranchColors(map: MindMapData): Map<string, string> {
    const topics = new Map(map.topics.map((topic) => [topic.id, topic]));
    const colors = new Map<string, string>();
    const resolved = new Map<string, string | undefined>();
    function resolve(topic: MindMapTopic): string | undefined {
        if (resolved.has(topic.id)) return resolved.get(topic.id);
        const color = topic.color
            ? branchColors[topic.color]
            : topic.parent_id
              ? resolve(topics.get(topic.parent_id)!)
              : undefined;
        resolved.set(topic.id, color);
        if (color) colors.set(topic.id, color);
        return color;
    }
    map.topics.forEach(resolve);
    return colors;
}
export function withMindMapBranchStyle(
    map: MindMapData,
    id: string,
    style: { color?: BranchColor; icon?: string },
): MindMapData {
    return {
        ...map,
        version: map.version >= 6 ? map.version : 6,
        topics: map.topics.map((topic) => {
            if (topic.id !== id) return topic;
            const next = { ...topic, ...style };
            if (next.color === undefined) delete next.color;
            if (next.icon === undefined) delete next.icon;
            return next;
        }),
    };
}
