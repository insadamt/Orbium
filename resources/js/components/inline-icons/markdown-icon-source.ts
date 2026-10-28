import { markdownFormattingTree } from '@/components/editor/markdown/interactions/markdown-formatting-source';
import type { EditorState } from '@codemirror/state';
import type { SyntaxNode } from '@lezer/common';
import { readOrbiumMetadata } from '@/components/editor/markdown/dialect/metadata';
import { escapeMarkdownLabel } from '@/components/editor/markdown/markdown-syntax';
import { isBuiltinIcon, type InlineIconChoice } from './icon-catalog';

export function serializeInlineIcon(
    choice: InlineIconChoice,
    formatting: { color?: string; underline?: boolean } = {},
): string {
    if (choice.kind === 'emoji') return choice.value;
    const label = escapeMarkdownLabel(choice.label).replace(/[\r\n]/g, ' ');
    const content =
        choice.kind === 'custom'
            ? `![${label}](orbium:attachment/${choice.attachmentId})`
            : label;
    return `:orbium[${content}]${JSON.stringify({ ...formatting, icon: choice.kind === 'custom' ? 'custom' : choice.name, ...(choice.kind === 'builtin' && choice.color ? { color: choice.color } : {}) })}`;
}

export function serializeReplacementIcon(
    state: EditorState,
    from: number,
    to: number,
    choice: InlineIconChoice,
): string {
    let node: SyntaxNode | null = markdownFormattingTree(state).resolveInner(
        from,
        1,
    );
    while (
        node &&
        !(node.name === 'OrbiumSpan' && node.from === from && node.to === to)
    )
        node = node.parent;
    const metadataNode = node?.getChild('OrbiumMetadata');
    const metadata =
        metadataNode &&
        readOrbiumMetadata(
            state.sliceDoc(metadataNode.from, metadataNode.to),
            'inline',
        );
    //
    // Symbol replacement must keep the selection's color rather than requiring a second formatting action.
    //
    return serializeInlineIcon(
        choice,
        metadata?.icon
            ? {
                  ...(metadata.color ? { color: metadata.color } : {}),
                  ...(metadata.underline ? { underline: true } : {}),
              }
            : {},
    );
}

export function readMarkdownIcon(
    state: EditorState,
    node: SyntaxNode,
): InlineIconChoice | null {
    if (node.name !== 'OrbiumSpan') return null;
    const metadataNode = node.getChild('OrbiumMetadata');
    const metadata =
        metadataNode &&
        readOrbiumMetadata(
            state.sliceDoc(metadataNode.from, metadataNode.to),
            'inline',
        );
    if (!metadata?.icon) return null;
    const markers = node.getChildren('OrbiumSpanMark');
    if (markers.length !== 2) return null;
    const label = state
        .sliceDoc(markers[0].to, markers[1].from)
        .replace(/\\([\\`*_{}[\]()#+.!<>:=-])/g, '$1');
    if (isBuiltinIcon(metadata.icon))
        return {
            kind: 'builtin',
            name: metadata.icon,
            label,
            ...(metadata.color ? { color: metadata.color } : {}),
        };
    const image = node.getChild('Image');
    const url = image?.getChild('URL');
    const reference =
        url &&
        /^<?orbium:attachment\/([1-9]\d*)>?$/.exec(
            state.sliceDoc(url.from, url.to),
        );
    if (!image || !reference || !Number.isSafeInteger(Number(reference[1])))
        return null;
    const imageMarks = image.getChildren('LinkMark');
    const closing = imageMarks.find(
        (mark) => state.sliceDoc(mark.from, mark.to) === ']',
    );
    const imageLabel = state
        .sliceDoc(image.from + 2, closing?.from ?? image.to)
        .replace(/\\([\\`*_{}[\]()#+.!<>:=-])/g, '$1');
    return {
        kind: 'custom',
        attachmentId: Number(reference[1]),
        label: imageLabel,
    };
}
