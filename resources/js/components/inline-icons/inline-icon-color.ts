import { isValidTextColor } from '@/components/editor/text-color';

export function inlineIconColorStyle(color?: string): string | undefined {
    if (!color || !isValidTextColor(color)) return undefined;
    return color.startsWith('preset:')
        ? `var(--editor-text-color-${color.slice(7)})`
        : color;
}
