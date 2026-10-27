import type { MindMapData } from './mindmap-data';

export const mindMapTemplates = [
    {
        id: 'balanced',
        name: 'Balanced mind map',
        description: 'Ideas branching on both sides',
    },
    {
        id: 'tree-right',
        name: 'Right-facing tree',
        description: 'A hierarchy growing to the right',
    },
    {
        id: 'tree-left',
        name: 'Left-facing tree',
        description: 'A hierarchy growing to the left',
    },
    {
        id: 'hierarchy-down',
        name: 'Top-down hierarchy',
        description: 'Organization and project breakdowns',
    },
    {
        id: 'hierarchy-up',
        name: 'Bottom-up hierarchy',
        description: 'Parts building toward a whole',
    },
    {
        id: 'outline',
        name: 'Outline tree',
        description: 'Compact, indented topic rows',
    },
    {
        id: 'brace',
        name: 'Brace map',
        description: 'Group a whole into smaller parts',
    },
    {
        id: 'fishbone',
        name: 'Fishbone',
        description: 'Causes leading toward an outcome',
    },
    {
        id: 'timeline',
        name: 'Timeline',
        description: 'Milestones along a shared line',
    },
] as const;
export type MindMapLayoutId =
    | (typeof mindMapTemplates)[number]['id']
    | 'timeline-vertical';
export function validMindMapLayout(value: unknown): value is MindMapLayoutId {
    return (
        value === 'timeline-vertical' ||
        mindMapTemplates.some((template) => template.id === value)
    );
}
export function withMindMapLayout(
    map: MindMapData,
    layout: MindMapLayoutId,
): MindMapData {
    return { ...map, version: map.version >= 5 ? map.version : 5, layout };
}
