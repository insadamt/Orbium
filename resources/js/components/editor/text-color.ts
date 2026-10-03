import { Mark, mergeAttributes } from '@tiptap/core';

export const TextColor = Mark.create({
    name: 'textColor',

    addAttributes() {
        return {
            color: {
                default: null,
                parseHTML: (element: HTMLElement) => {
                    const color = element.getAttribute('data-text-color');
                    return color && /^#[0-9a-fA-F]{6}$/.test(color)
                        ? color.toLowerCase()
                        : null;
                },
                renderHTML: ({ color }: { color: string | null }) =>
                    color && /^#[0-9a-fA-F]{6}$/.test(color)
                        ? { 'data-text-color': color, style: `color: ${color}` }
                        : {},
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'span[data-text-color]',
                getAttrs: (element) =>
                    /^#[0-9a-fA-F]{6}$/.test(
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
