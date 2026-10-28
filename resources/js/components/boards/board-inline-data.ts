import { validInlineIconAttributes } from '@/components/inline-icons/inline-icon-data';
import type { BoardInline } from './board-types';
import { isValidTextColor } from '@/components/editor/text-color';

export function safeBoardLink(href: string) {
    for (const character of href) {
        const code = character.charCodeAt(0);
        if (code <= 32 || code === 127) return false;
    }
    return (
        Boolean(href) &&
        !href.startsWith('//') &&
        (!/^[a-z][a-z0-9+.-]*:/i.test(href) ||
            /^(https?:\/\/|mailto:)/i.test(href))
    );
}
export function validBoardInline(value: unknown): value is BoardInline[] {
    return (
        Array.isArray(value) &&
        value.length <= 10000 &&
        value.every(
            (node) =>
                node &&
                typeof node === 'object' &&
                (node.type === 'hardBreak' ||
                    (node.type === 'text' && typeof node.text === 'string') ||
                    (node.type === 'inlineIcon' &&
                        validInlineIconAttributes(node.attrs))) &&
                (node.marks === undefined ||
                    (Array.isArray(node.marks) &&
                        node.marks.length <= 8 &&
                        node.marks.every(
                            (
                                mark: BoardInline['marks'] extends
                                    | (infer M)[]
                                    | undefined
                                    ? M
                                    : never,
                            ) =>
                                mark &&
                                typeof mark === 'object' &&
                                !Array.isArray(mark) &&
                                (mark.attrs === undefined ||
                                    (mark.attrs !== null &&
                                        typeof mark.attrs === 'object' &&
                                        !Array.isArray(mark.attrs))) &&
                                [
                                    'bold',
                                    'italic',
                                    'underline',
                                    'strike',
                                    'code',
                                    'link',
                                    'textColor',
                                ].includes(mark.type) &&
                                (mark.type !== 'link' ||
                                    (typeof mark.attrs?.href === 'string' &&
                                        safeBoardLink(mark.attrs.href))) &&
                                (mark.type !== 'textColor' ||
                                    (typeof mark.attrs?.color === 'string' &&
                                        isValidTextColor(mark.attrs.color))),
                        ))),
        )
    );
}

export function hasNativeBoardInlineIcons(data: unknown): boolean {
    if (!data || typeof data !== 'object') return false;
    const value = data as Record<string, unknown>;
    const groups: unknown[] = [value.content];
    if (Array.isArray(value.items))
        for (const item of value.items) groups.push(item?.content);
    if (Array.isArray(value.rows))
        for (const row of value.rows)
            if (Array.isArray(row)) groups.push(...row);
    return groups.some(
        (content) =>
            Array.isArray(content) &&
            content.some((node) => node?.type === 'inlineIcon'),
    );
}
