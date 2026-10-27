import {
    validBranchColor,
    validBranchIcon,
    type BranchColor,
} from './mindmap-branch-style';
import { validMindMapLayout, type MindMapLayoutId } from './mindmap-templates';
import type { JSONContent } from '@tiptap/core';
import { validMindMapDocument } from './mindmap-topic-document';
import type { BoardInline } from '@/components/boards/board-types';
import { mindMapTopicWidth } from './mindmap-topic-width';
import { validMindMapTopicContent } from './mindmap-rich-text';
export type MindMapTopic = {
    id: string;
    parent_id: string | null;
    text: string;
    collapsed: boolean;
    content?: BoardInline[];
    width?: number;
    body?: JSONContent;
    color?: BranchColor;
    icon?: string;
};
export type MindMapData = {
    version: 1 | 2 | 3 | 4 | 5 | 6 | 7;
    layout?: MindMapLayoutId;
    root_id: string;
    topics: MindMapTopic[];
};
export const mindMapLimits = { bytes: 65536, depth: 64, text: 500 };
const identifier = /^[a-zA-Z0-9_-]{1,64}$/;
const invalidText =
    /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u;

export function validMindMap(value: unknown): value is MindMapData {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        return false;
    const map = value as MindMapData;
    if (
        Object.keys(map).some(
            (key) =>
                ![
                    'version',
                    'root_id',
                    'topics',
                    ...(map.version >= 5 ? ['layout'] : []),
                ].includes(key),
        ) ||
        ![1, 2, 3, 4, 5, 6, 7].includes(map.version) ||
        (map.layout !== undefined && !validMindMapLayout(map.layout)) ||
        typeof map.root_id !== 'string' ||
        !identifier.test(map.root_id) ||
        !Array.isArray(map.topics) ||
        !map.topics.length
    )
        return false;
    try {
        if (
            new TextEncoder().encode(JSON.stringify(map)).length >
            mindMapLimits.bytes
        )
            return false;
    } catch {
        return false;
    }
    const topics = new Map<string, MindMapTopic>();
    for (const topic of map.topics) {
        if (
            !topic ||
            typeof topic !== 'object' ||
            Array.isArray(topic) ||
            Object.keys(topic).some(
                (key) =>
                    ![
                        'id',
                        'parent_id',
                        'text',
                        'collapsed',
                        ...(map.version >= 2 ? ['content'] : []),
                        ...(map.version >= 3 ? ['width'] : []),
                        ...(map.version >= 4 ? ['body'] : []),
                        ...(map.version >= 6 ? ['color', 'icon'] : []),
                    ].includes(key),
            ) ||
            typeof topic.id !== 'string' ||
            !identifier.test(topic.id) ||
            topics.has(topic.id) ||
            (topic.parent_id !== null &&
                (typeof topic.parent_id !== 'string' ||
                    !identifier.test(topic.parent_id))) ||
            typeof topic.text !== 'string' ||
            Array.from(topic.text).length > mindMapLimits.text ||
            invalidText.test(topic.text) ||
            Array.from(topic.text).some((character) => {
                const code = character.codePointAt(0)!;
                return (
                    code === 127 || (code < 32 && ![9, 10, 13].includes(code))
                );
            }) ||
            (topic.color !== undefined && !validBranchColor(topic.color)) ||
            (topic.icon !== undefined && !validBranchIcon(topic.icon)) ||
            (topic.body !== undefined &&
                (topic.content !== undefined ||
                    !validMindMapDocument(
                        topic.body,
                        topic.text,
                        map.version >= 7,
                    ))) ||
            (topic.content !== undefined &&
                !validMindMapTopicContent(topic.content, topic.text)) ||
            (topic.width !== undefined &&
                (typeof topic.width !== 'number' ||
                    !Number.isInteger(topic.width) ||
                    topic.width < mindMapTopicWidth.min ||
                    topic.width > mindMapTopicWidth.max)) ||
            typeof topic.collapsed !== 'boolean'
        )
            return false;
        topics.set(topic.id, topic);
    }
    if (topics.get(map.root_id)?.parent_id !== null) return false;
    for (const topic of map.topics) {
        const seen = new Set<string>();
        let current: MindMapTopic | undefined = topic;
        while (current && current.id !== map.root_id) {
            if (
                seen.has(current.id) ||
                seen.size >= mindMapLimits.depth ||
                current.parent_id === null
            )
                return false;
            seen.add(current.id);
            current = topics.get(current.parent_id);
        }
        if (!current) return false;
    }
    return true;
}
export function createMindMap(): MindMapData {
    const id = crypto.randomUUID();
    return {
        version: 1,
        root_id: id,
        topics: [
            { id, parent_id: null, text: 'Central topic', collapsed: false },
        ],
    };
}
export function mindMapText(map: MindMapData) {
    return map.topics.map((topic) => topic.text).join('\n');
}
export function mindMapDescendants(map: MindMapData, id: string) {
    const children = new Map<string, string[]>();
    for (const topic of map.topics) {
        if (topic.parent_id !== null)
            children.set(topic.parent_id, [
                ...(children.get(topic.parent_id) ?? []),
                topic.id,
            ]);
    }
    const result = new Set<string>();
    const pending = [id];
    while (pending.length) {
        const next = pending.pop()!;
        if (result.has(next)) continue;
        result.add(next);
        pending.push(...(children.get(next) ?? []));
    }
    return result;
}
export function mindMapOutline(map: MindMapData) {
    const children = new Map<string | null, MindMapTopic[]>();
    for (const topic of map.topics) {
        const siblings = children.get(topic.parent_id) ?? [];
        siblings.push(topic);
        children.set(topic.parent_id, siblings);
    }
    const lines: string[] = [];
    function visit(topic: MindMapTopic, depth: number) {
        const text = topic.text.replace(/[\r\n\t]+/g, ' ');
        lines.push(`${'  '.repeat(depth)}- ${text}`);
        for (const child of children.get(topic.id) ?? [])
            visit(child, depth + 1);
    }
    visit(
        map.topics.find((topic) => topic.id === map.root_id)!,
        0,
    );
    const outline = lines.join('\n');
    const fence = '`'.repeat(
        Math.max(
            3,
            ...(outline.match(/`+/g) ?? []).map((run) => run.length + 1),
        ),
    );
    return `${fence}text\n${outline}\n${fence}`;
}

export function moveMindMapTopic(
    map: MindMapData,
    id: string,
    parentId: string,
): MindMapData {
    const topics = new Map(map.topics.map((topic) => [topic.id, topic]));
    const expanded = new Set<string>();
    let ancestor = topics.get(parentId);
    while (ancestor && !expanded.has(ancestor.id)) {
        expanded.add(ancestor.id);
        ancestor =
            ancestor.parent_id === null
                ? undefined
                : topics.get(ancestor.parent_id);
    }
    return {
        ...map,
        topics: map.topics.map((topic) => ({
            ...topic,
            ...(topic.id === id ? { parent_id: parentId } : {}),
            ...(expanded.has(topic.id) ? { collapsed: false } : {}),
        })),
    };
}
