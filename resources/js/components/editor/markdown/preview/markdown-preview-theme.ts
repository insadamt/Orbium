import { EditorView } from '@codemirror/view';

export const markdownPreviewTheme = [
    EditorView.perLineTextDirection.of(true),
    EditorView.editorAttributes.of({ class: 'orbium-markdown-live-preview' }),
    EditorView.contentAttributes.of({
        class: 'orbium-editor orbium-markdown-content',
    }),
    EditorView.theme({
        '&': { height: 'auto', minHeight: '45vh', fontSize: '1.03rem' },
        '.cm-scroller': {
            fontFamily: 'var(--font-sans, sans-serif)',
            lineHeight: '1.75',
            overflow: 'visible',
        },
        '.cm-content': { padding: '0', minHeight: '45vh' },
        '.cm-line': { padding: '0' },
        '.cm-activeLine': { backgroundColor: 'transparent' },
        '.cm-md-source': {
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '14px',
            backgroundColor: 'var(--muted)',
        },
    }),
];

export const markdownSlashMenuTheme = EditorView.theme({
    '.cm-tooltip-autocomplete.orbium-slash-menu': {
        borderRadius: '12px',
        padding: '4px',
        width: '256px',
        maxWidth: 'calc(100vw - 16px)',
    },
    '.cm-tooltip-autocomplete.orbium-slash-menu > ul': {
        fontFamily: 'var(--font-sans, sans-serif)',
        maxHeight: '280px',
    },
    '.cm-tooltip-autocomplete.orbium-slash-menu > ul > li': {
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '14px',
        lineHeight: '20px',
    },
    '.cm-tooltip-autocomplete.orbium-slash-menu > ul > li[aria-selected]': {
        backgroundColor: 'var(--accent)',
        color: 'var(--accent-foreground)',
    },
});
