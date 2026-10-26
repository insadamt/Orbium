import type { BoardInline } from '@/components/boards/board-types';
import { validBoardInline } from '@/components/boards/board-inline-data';
import type { MindMapTopic } from './mindmap-data';

export function mindMapInlineText(content: BoardInline[]): string {
    return content
        .map((node) => (node.type === 'hardBreak' ? '\n' : (node.text ?? '')))
        .join('');
}
export function mindMapTopicContent(topic: MindMapTopic): BoardInline[] {
    if (topic.content) return topic.content;
    return topic.text
        .split('\n')
        .flatMap((line, index) => [
            ...(index ? [{ type: 'hardBreak' as const }] : []),
            ...(line ? [{ type: 'text' as const, text: line }] : []),
        ]);
}
export function validMindMapTopicContent(content: unknown, text: string) {
    if (!validBoardInline(content)) return false;
    return (
        content.every(
            (node) =>
                Object.keys(node).every((key) =>
                    ['type', 'text', 'marks'].includes(key),
                ) &&
                (node.type === 'hardBreak'
                    ? Object.keys(node).length === 1
                    : Boolean(node.text)) &&
                (node.marks ?? []).every(
                    (mark) =>
                        Object.keys(mark).every((key) =>
                            ['type', 'attrs'].includes(key),
                        ) &&
                        (mark.type !== 'link' ||
                            (mark.attrs?.href?.length ?? 0) <= 2048) &&
                        (!mark.attrs ||
                            Object.keys(mark.attrs).every(
                                (key) =>
                                    key ===
                                    (mark.type === 'textColor'
                                        ? 'color'
                                        : 'href'),
                            )),
                ),
        ) && mindMapInlineText(content) === text
    );
}
