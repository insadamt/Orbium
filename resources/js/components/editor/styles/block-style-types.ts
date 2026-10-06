export const blockStyleTypes = [
    ['paragraph', 'Paragraph'],
    ['heading-1', 'Heading 1'],
    ['heading-2', 'Heading 2'],
    ['heading-3', 'Heading 3'],
    ['bullet-list', 'Bullet list'],
    ['ordered-list', 'Numbered list'],
    ['checklist', 'Checklist'],
    ['quote', 'Quote'],
    ['callout', 'Callout'],
    ['code', 'Code'],
    ['table', 'Table'],
    ['image', 'Image'],
    ['file', 'File'],
    ['mermaid', 'Mermaid'],
    ['math', 'Math'],
    ['divider', 'Divider'],
] as const;

export type BlockStyleType = (typeof blockStyleTypes)[number][0];
export type EditorStyles = {
    enabled: boolean;
    stylesheet: string;
    overrides: Partial<Record<BlockStyleType, string>>;
};
export const defaultEditorStyles: EditorStyles = {
    enabled: true,
    stylesheet: '',
    overrides: {},
};

export function normalizeEditorStyles(
    value?: EditorStyles | null,
): EditorStyles {
    return {
        enabled: value?.enabled ?? true,
        stylesheet: value?.stylesheet ?? '',
        overrides: Object.fromEntries(
            blockStyleTypes.map(([type]) => [
                type,
                value?.overrides?.[type] ?? '',
            ]),
        ),
    };
}

export function exportEditorStyles(styles: EditorStyles): string {
    return [
        styles.stylesheet,
        ...blockStyleTypes.map(([type]) => {
            const declarations = styles.overrides[type]?.trim();
            return declarations ? `.orbium-${type} {\n${declarations}\n}` : '';
        }),
    ]
        .filter(Boolean)
        .join('\n\n');
}
