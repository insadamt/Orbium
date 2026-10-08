import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

export function markdownSourceHighlighting(dark: boolean) {
    return syntaxHighlighting(
        HighlightStyle.define([
            { tag: tags.heading, fontWeight: '600' },
            { tag: tags.strong, fontWeight: '600' },
            { tag: tags.emphasis, fontStyle: 'italic' },
            { tag: tags.strikethrough, textDecoration: 'line-through' },
            {
                tag: [tags.link, tags.url],
                color: dark ? '#a9c7ff' : '#24529b',
            },
            {
                tag: [tags.monospace, tags.string],
                color: dark ? '#a6dcae' : '#286a37',
            },
            {
                tag: [tags.meta, tags.processingInstruction, tags.comment],
                color: 'var(--muted-foreground)',
            },
        ]),
    );
}

export function markdownTheme(dark: boolean) {
    return EditorView.theme(
        {
            '&': {
                color: 'var(--foreground)',
                backgroundColor: 'transparent',
                fontSize: '14px',
                height: 'clamp(240px, 65dvh, 900px)',
            },
            '.cm-scroller': {
                overflow: 'auto',
                fontFamily: 'var(--font-mono, monospace)',
                lineHeight: '1.7',
            },
            '.cm-content': {
                padding: '12px 0',
                caretColor: 'var(--foreground)',
            },
            '.cm-line': { padding: '0 12px' },
            '.cm-gutters': {
                backgroundColor: 'transparent',
                color: 'var(--muted-foreground)',
                border: 'none',
            },
            '.cm-activeLine, .cm-activeLineGutter': {
                backgroundColor: 'var(--muted)',
            },
            '&.cm-focused': { outline: 'none' },
            '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
                { backgroundColor: 'var(--accent)' },
            '.cm-cursor': { borderLeftColor: 'var(--foreground)' },
            '.cm-searchMatch': {
                backgroundColor: 'var(--accent)',
                outline: '1px solid var(--muted-foreground)',
            },
        },
        { dark },
    );
}
