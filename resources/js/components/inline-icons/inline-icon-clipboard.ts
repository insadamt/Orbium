import { EditorSelection, EditorState } from '@codemirror/state';
import type { JSONContent } from '@tiptap/core';
import {
    selectedMarkdownBlocks,
    type TextMarks,
} from '@/components/editor/markdown/interactions/markdown-formatting-runs';
import { markdownFormattingTree } from '@/components/editor/markdown/interactions/markdown-formatting-source';
import { safeBoardLink } from '@/components/boards/board-inline-data';
import { readMarkdownIcon } from './markdown-icon-source';

function clipboardMarks(marks: TextMarks): NonNullable<JSONContent['marks']> {
    return [
        ...(['bold', 'italic', 'strike', 'underline', 'code'] as const)
            .filter((name) => marks[name])
            .map((type) => ({ type })),
        ...(marks.color
            ? [{ type: 'textColor', attrs: { color: marks.color } }]
            : []),
        ...(marks.href && safeBoardLink(marks.href)
            ? [{ type: 'link', attrs: { href: marks.href } }]
            : []),
    ];
}

export function readInlineIconClipboard(source: string): JSONContent[] | null {
    if (!source.includes(':orbium[') || source.length > 262144) return null;
    const state = EditorState.create({ doc: source });
    const tree = markdownFormattingTree(state);
    const blocks = selectedMarkdownBlocks(
        state,
        EditorSelection.single(0, source.length),
    );
    const content: JSONContent[] = [];
    let hasIcon = false;
    let previousEnd = 0;
    for (const block of blocks) {
        if (block.from > previousEnd && content.length)
            content.push({ type: 'hardBreak' });
        for (const run of block.runs) {
            const marks = clipboardMarks(run.marks);
            if (run.icon) {
                let node = tree.resolveInner(run.from, 1);
                while (node.parent && node.name !== 'OrbiumSpan')
                    node = node.parent;
                const choice = readMarkdownIcon(state, node);
                if (!choice || choice.kind === 'emoji') return null;
                hasIcon = true;
                content.push({
                    type: 'inlineIcon',
                    attrs: {
                        version: 1,
                        kind: choice.kind,
                        label: choice.label,
                        name: choice.kind === 'builtin' ? choice.name : null,
                        attachmentId:
                            choice.kind === 'custom'
                                ? choice.attachmentId
                                : null,
                    },
                    marks,
                });
            } else {
                const text =
                    run.literal || run.protected
                        ? run.source
                        : run.source.replace(
                              /\\([\\`*_{}[\]()#+.!<>:=-])/g,
                              '$1',
                          );
                text.split('\n').forEach((line, index) => {
                    if (index) content.push({ type: 'hardBreak' });
                    if (line) content.push({ type: 'text', text: line, marks });
                });
            }
        }
        previousEnd = block.to;
    }
    //
    // Only consume complete inline selections; unsupported block syntax must remain available to the normal paste path.
    //
    if (
        !hasIcon ||
        blocks.some((block, index) =>
            source.slice(index ? blocks[index - 1].to : 0, block.from).trim(),
        ) ||
        source.slice(previousEnd).trim()
    )
        return null;
    return content;
}
