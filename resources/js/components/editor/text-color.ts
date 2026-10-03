import { Mark, mergeAttributes } from '@tiptap/core';

const PRESET_LIGHT_COLORS: Record<string, string> = {
    charcoal: '#3f2c24',
    gray: '#624234',
    red: '#eb2424',
    orange: '#eb8424',
    amber: '#7b500b',
    green: '#24eb4b',
    teal: '#24c9eb',
    blue: '#75a1ff',
    purple: '#3700ff',
    pink: '#eb24e4',
};

function isValidTextColor(color: string): boolean {
    return (
        /^#[0-9a-fA-F]{6}$/.test(color) ||
        (color.startsWith('preset:') &&
            Object.hasOwn(PRESET_LIGHT_COLORS, color.slice(7)))
    );
}

function renderTextColor(color: string): Record<string, string> {
    if (!isValidTextColor(color)) return {};
    if (color.startsWith('preset:')) {
        const name = color.slice(7);
        return {
            'data-text-color': color,
            style: `color: var(--editor-text-color-${name}, ${PRESET_LIGHT_COLORS[name]})`,
        };
    }
    return { 'data-text-color': color, style: `color: ${color}` };
}

export const TextColor = Mark.create({
    name: 'textColor',

    addAttributes() {
        return {
            color: {
                default: null,
                parseHTML: (element: HTMLElement) => {
                    const color = element.getAttribute('data-text-color');
                    return color && isValidTextColor(color)
                        ? color.toLowerCase()
                        : null;
                },
                renderHTML: ({ color }: { color: string | null }) =>
                    color ? renderTextColor(color) : {},
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'span[data-text-color]',
                getAttrs: (element) =>
                    isValidTextColor(
                        (element as HTMLElement).getAttribute(
                            'data-text-color',
                        ) ?? '',
                    )
                        ? {}
                        : false,
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes(HTMLAttributes), 0];
    },
});
