import type { EditorState } from '@codemirror/state';
import type { SyntaxNode } from '@lezer/common';
import { readOrbiumMetadata } from '@/components/editor/markdown/dialect/metadata';
import { escapeMarkdownLabel } from '@/components/editor/markdown/markdown-syntax';
import { isBuiltinIcon, type InlineIconChoice } from './icon-catalog';

export function serializeInlineIcon(choice: InlineIconChoice): string {
    if (choice.kind === 'emoji') return choice.value;
    const label = escapeMarkdownLabel(choice.label).replace(/[\r\n]/g, ' ');
    const content =
        choice.kind === 'custom'
            ? `![${label}](orbium:attachment/${choice.attachmentId})`
            : label;
    return `:orbium[${content}]${JSON.stringify({ icon: choice.kind === 'custom' ? 'custom' : choice.name })}`;
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
        return { kind: 'builtin', name: metadata.icon, label };
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
