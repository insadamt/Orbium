import { readCalloutSource } from '../dialect/callout-source';
import type { RichBlock } from '../rich/rich-model';

export const markdownConversionPrefixes: Record<string, string> = {
    Text: '',
    'Heading 1': '# ',
    'Heading 2': '## ',
    'Heading 3': '### ',
    'Bullet list': '- ',
    'Numbered list': '1. ',
    Checklist: '- [ ] ',
    Quote: '> ',
    Code: '```',
};

export function canAlignMarkdownBlock(name: string, source: string) {
    return (
        /^(?:Paragraph|(?:ATX|Setext)Heading[1-6])$/.test(name) ||
        (name === 'Blockquote' && Boolean(readCalloutSource(source)))
    );
}

export function markdownBlockConversionTargets(
    name: string,
    richKind?: RichBlock['kind'],
) {
    // Attachment paragraphs and diagram fences share text syntax nodes but require their own editors.

    if (
        richKind &&
        !['metadata', 'empty', 'callout', 'code'].includes(richKind)
    )
        return [];
    return /^(?:Paragraph|(?:ATX|Setext)Heading[1-6]|BulletList|OrderedList|Blockquote|FencedCode)$/.test(
        name,
    )
        ? Object.keys(markdownConversionPrefixes)
        : [];
}
