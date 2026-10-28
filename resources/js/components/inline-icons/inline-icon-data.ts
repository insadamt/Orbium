import { isBuiltinIcon } from './icon-catalog';

export type InlineIconAttributes = {
    version: 1;
    kind: 'builtin' | 'custom';
    label: string;
    name: string | null;
    attachmentId: number | null;
};

export function validInlineIconAttributes(
    value: unknown,
): value is InlineIconAttributes {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        return false;
    const attrs = value as Record<string, unknown>;
    if (
        Object.keys(attrs).some(
            (key) =>
                !['version', 'kind', 'label', 'name', 'attachmentId'].includes(
                    key,
                ),
        ) ||
        attrs.version !== 1 ||
        typeof attrs.label !== 'string' ||
        !attrs.label.trim() ||
        Array.from(attrs.label).length > 160 ||
        Array.from(attrs.label).some((character) => {
            const code = character.codePointAt(0)!;
            return code < 32 || code === 127;
        })
    )
        return false;
    return attrs.kind === 'builtin'
        ? isBuiltinIcon(attrs.name) && attrs.attachmentId == null
        : attrs.kind === 'custom' &&
              Number.isSafeInteger(attrs.attachmentId) &&
              Number(attrs.attachmentId) > 0 &&
              attrs.name == null;
}
