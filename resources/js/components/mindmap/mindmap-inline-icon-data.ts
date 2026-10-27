import type { JSONContent } from '@tiptap/core';
import { isBuiltinIcon } from '@/components/inline-icons/icon-catalog';
import { validMindMapTopicContent } from './mindmap-rich-text';
import type { BoardInline } from '@/components/boards/board-types';

export function validMindMapInlineIcon(node: JSONContent): boolean {
    const attrs = node.attrs;
    if (
        !attrs ||
        typeof attrs !== 'object' ||
        Array.isArray(attrs) ||
        Object.keys(node).some(
            (key) => !['type', 'attrs', 'marks'].includes(key),
        ) ||
        Object.keys(attrs).some(
            (key) =>
                !['version', 'kind', 'label', 'name', 'attachmentId'].includes(
                    key,
                ),
        )
    )
        return false;
    if (
        attrs.version !== 1 ||
        typeof attrs.label !== 'string' ||
        !attrs.label.trim() ||
        Array.from(attrs.label).length > 160 ||
        Array.from(attrs.label as string).some((character) => {
            const codePoint = character.codePointAt(0)!;
            return codePoint < 32 || codePoint === 127;
        })
    )
        return false;
    if (
        attrs.kind === 'builtin'
            ? !isBuiltinIcon(attrs.name) || attrs.attachmentId != null
            : attrs.kind !== 'custom' ||
              !Number.isSafeInteger(attrs.attachmentId) ||
              attrs.attachmentId < 1 ||
              attrs.name != null
    )
        return false;
    return validMindMapTopicContent(
        [
            {
                type: 'text',
                text: attrs.label,
                ...(node.marks
                    ? { marks: node.marks as BoardInline['marks'] }
                    : {}),
            },
        ],
        attrs.label,
    );
}
export function mindMapDocumentInlineText(content: JSONContent[]): string {
    return content
        .map((node) =>
            node.type === 'inlineIcon'
                ? String(node.attrs?.label ?? '')
                : node.type === 'hardBreak'
                  ? '\n'
                  : (node.text ?? ''),
        )
        .join('');
}
