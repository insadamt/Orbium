import type { EditorSelection } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { applyMarkdownSelectionFormatting } from './markdown-formatting-transaction';
export { inlineFormattingRange } from './markdown-inline-ranges';

export function formatMarkdownSelection(
    view: EditorView,
    delimiter: '**' | '*' | '~~' | '`',
    selection?: EditorSelection,
) {
    const mark =
        delimiter === '**'
            ? 'bold'
            : delimiter === '*'
              ? 'italic'
              : delimiter === '~~'
                ? 'strike'
                : 'code';
    applyMarkdownSelectionFormatting(view, { kind: 'toggle', mark }, selection);
}

export function setMarkdownInlineMetadata(
    view: EditorView,
    patch: { color?: string | null; underline?: boolean },
    selection?: EditorSelection,
) {
    if ('color' in patch)
        applyMarkdownSelectionFormatting(
            view,
            { kind: 'color', color: patch.color ?? null },
            selection,
        );
    if ('underline' in patch)
        applyMarkdownSelectionFormatting(
            view,
            { kind: 'toggle', mark: 'underline' },
            selection,
        );
}

export function setMarkdownLink(
    view: EditorView,
    destination: string | null,
    selection?: EditorSelection,
) {
    let href: string | null = null;
    if (destination) {
        if (
            !/^(https?:\/\/|mailto:)/i.test(destination) ||
            /[\s<>\\]/.test(destination)
        )
            throw new Error(
                'Use an HTTP, HTTPS or mailto link without spaces.',
            );
        const url = new URL(destination);
        if (!['http:', 'https:', 'mailto:'].includes(url.protocol))
            throw new Error('Unsupported link.');
        href = url.href;
    }
    applyMarkdownSelectionFormatting(view, { kind: 'link', href }, selection);
}
