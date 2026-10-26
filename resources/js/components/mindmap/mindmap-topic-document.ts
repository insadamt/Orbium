import { validBoardInline } from '@/components/boards/board-inline-data';
import type { JSONContent } from '@tiptap/core';
import {
    validMindMapTopicContent,
    mindMapInlineText,
    mindMapTopicContent,
} from './mindmap-rich-text';
import type { MindMapData, MindMapTopic } from './mindmap-data';
import type { BoardInline } from '@/components/boards/board-types';

const containers: Record<string, string[]> = {
    doc: [
        'paragraph',
        'heading',
        'bulletList',
        'orderedList',
        'taskList',
        'blockquote',
        'callout',
        'codeBlock',
    ],
    bulletList: ['listItem'],
    orderedList: ['listItem'],
    taskList: ['taskItem'],
    listItem: [
        'paragraph',
        'bulletList',
        'orderedList',
        'taskList',
        'blockquote',
        'callout',
        'codeBlock',
        'heading',
    ],
    taskItem: [
        'paragraph',
        'bulletList',
        'orderedList',
        'taskList',
        'blockquote',
        'callout',
        'codeBlock',
        'heading',
    ],
    blockquote: [
        'paragraph',
        'heading',
        'bulletList',
        'orderedList',
        'taskList',
        'blockquote',
        'callout',
        'codeBlock',
    ],
    callout: [
        'paragraph',
        'heading',
        'bulletList',
        'orderedList',
        'taskList',
        'blockquote',
        'callout',
        'codeBlock',
    ],
};
export function mindMapDocumentText(node: JSONContent): string {
    if (['paragraph', 'heading', 'codeBlock'].includes(node.type ?? ''))
        return mindMapInlineText((node.content ?? []) as BoardInline[]);
    return (node.content ?? []).map(mindMapDocumentText).join('\n');
}
export function validMindMapDocument(
    value: unknown,
    text: string,
): value is JSONContent {
    let count = 0;
    function valid(value: unknown, allowed: string[], depth: number): boolean {
        if (
            !value ||
            typeof value !== 'object' ||
            Array.isArray(value) ||
            ++count > 256 ||
            depth > 16
        )
            return false;
        const node = value as JSONContent;
        if (
            !allowed.includes(node.type ?? '') ||
            Object.keys(node).some(
                (key) => !['type', 'attrs', 'content'].includes(key),
            )
        )
            return false;
        const attrs = node.attrs ?? {};
        if (!attrs || typeof attrs !== 'object' || Array.isArray(attrs))
            return false;
        const attribute = (
            {
                heading: 'level',
                orderedList: 'start',
                taskItem: 'checked',
                codeBlock: 'language',
            } as Record<string, string>
        )[node.type!];
        if (Object.keys(attrs).some((key) => key !== attribute)) return false;
        if (node.type === 'heading' && ![1, 2, 3].includes(attrs.level))
            return false;
        if (
            node.type === 'orderedList' &&
            (!Number.isInteger(attrs.start) ||
                attrs.start < 1 ||
                attrs.start > 999999)
        )
            return false;
        if (node.type === 'taskItem' && typeof attrs.checked !== 'boolean')
            return false;
        if (
            node.type === 'codeBlock' &&
            attrs.language !== undefined &&
            attrs.language !== null &&
            attrs.language !== 'plaintext'
        )
            return false;
        const content = node.content ?? [];
        if (!Array.isArray(content)) return false;
        if (['paragraph', 'heading', 'codeBlock'].includes(node.type!)) {
            if (
                !validBoardInline(content) ||
                !validMindMapTopicContent(
                    content,
                    mindMapInlineText(content as BoardInline[]),
                )
            )
                return false;
            return (
                node.type !== 'codeBlock' ||
                content.every(
                    (child) => child.type === 'text' && !child.marks?.length,
                )
            );
        }
        return (
            content.length > 0 &&
            (!['listItem', 'taskItem'].includes(node.type!) ||
                content[0]?.type === 'paragraph') &&
            content.every((child) =>
                valid(child, containers[node.type!] ?? [], depth + 1),
            )
        );
    }
    return (
        valid(value, ['doc'], 0) &&
        mindMapDocumentText(value as JSONContent) === text
    );
}
export function mindMapTopicDocument(topic: MindMapTopic): JSONContent {
    return (
        topic.body ?? {
            type: 'doc',
            content: [
                { type: 'paragraph', content: mindMapTopicContent(topic) },
            ],
        }
    );
}
export function normalizeMindMapDocument(node: JSONContent): JSONContent {
    if (node.type === 'text' || node.type === 'hardBreak') {
        return {
            type: node.type,
            ...(node.text ? { text: node.text } : {}),
            ...(node.marks?.length
                ? {
                      marks: node.marks.map((mark) => ({
                          type: mark.type,
                          ...(mark.type === 'link'
                              ? { attrs: { href: mark.attrs?.href } }
                              : mark.type === 'textColor'
                                ? { attrs: { color: mark.attrs?.color } }
                                : {}),
                      })),
                  }
                : {}),
        };
    }
    const attrs =
        node.type === 'heading'
            ? { level: node.attrs?.level }
            : node.type === 'orderedList'
              ? { start: node.attrs?.start ?? 1 }
              : node.type === 'taskItem'
                ? { checked: node.attrs?.checked ?? false }
                : node.type === 'codeBlock'
                  ? { language: 'plaintext' }
                  : undefined;
    return {
        type: node.type,
        ...(attrs ? { attrs } : {}),
        content: (node.content ?? []).map(normalizeMindMapDocument),
    };
}
export function replaceMindMapTopicDocument(
    map: MindMapData,
    id: string,
    body: JSONContent,
): MindMapData {
    return {
        ...map,
        version: map.version === 5 ? 5 : 4,
        topics: map.topics.map((topic) => {
            if (topic.id !== id) return topic;
            //
            // One canonical document avoids stale inline content overriding structured text after a reload.
            //
            const next = { ...topic, text: mindMapDocumentText(body), body };
            delete next.content;
            return next;
        }),
    };
}
