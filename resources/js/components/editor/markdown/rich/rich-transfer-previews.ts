import { EditorState } from '@codemirror/state';
import { markdownSourceParser } from '../interactions/markdown-source-parser';
import type { EditorView } from '@codemirror/view';
import type { MarkdownBlockRange } from '../interactions/markdown-block-actions';
import type { CachedPreview } from '../../mermaid-preview-renderer';
import type { MermaidPreviewDimensions } from '../../mermaid-preview-entry';
import type { AttachmentMetadata, RichContext } from './rich-model';
import { readRichBlock } from './read-rich-block';
import { markdownBlockElement } from '../interactions/markdown-block-drag';
import {
    collectTransferableMediaPlayers,
    type TransferredMediaPlayer,
} from './transferred-media-players';
import {
    cachePreparedMathPreview,
    findPreparedMathPreview,
    type MathPreview,
} from './math-preview';

export type RichTransferPreviews = {
    diagrams: {
        source: string;
        preview: CachedPreview;
        dimensions?: MermaidPreviewDimensions;
    }[];
    equations: { latex: string; displayMode: boolean; preview: MathPreview }[];
    attachments: AttachmentMetadata[];
    players: TransferredMediaPlayer[];
};

export function collectRichTransferPreviews(
    view: EditorView,
    range: MarkdownBlockRange,
    context: RichContext,
): RichTransferPreviews {
    const result: RichTransferPreviews = {
        diagrams: [],
        equations: [],
        attachments: [],
        players: collectTransferableMediaPlayers(
            markdownBlockElement(view, range),
        ),
    };
    const collected = new Set<string>();
    function collectSource(source: string, depth = 0) {
        if (depth >= 32 || collected.has(source)) return;
        collected.add(source);
        const state = EditorState.create({ doc: source });
        markdownSourceParser.parse(source).iterate({
            enter({ node }) {
                const block = readRichBlock(state, node);
                if (!block) return;
                if (block.kind === 'callout')
                    collectSource(block.content, depth + 1);
                if (block.table)
                    for (const row of block.table.rows)
                        for (const cell of row)
                            collectSource(cell.source, depth + 1);
                if (block.kind === 'mermaid') {
                    const entry = context.mermaid.previews.get(block.content);
                    if (entry?.sanitized && entry.preview)
                        result.diagrams.push({
                            source: block.content,
                            preview: { ...entry.preview },
                            dimensions: entry.dimensions && {
                                ...entry.dimensions,
                            },
                        });
                }
                if (block.kind === 'math' || block.kind === 'inline-math') {
                    const request = {
                        context,
                        latex: block.content,
                        displayMode: block.kind === 'math',
                    };
                    const preview = findPreparedMathPreview(request);
                    if (preview)
                        result.equations.push({
                            latex: request.latex,
                            displayMode: request.displayMode,
                            preview: { ...preview },
                        });
                }
                if (block.attachmentId) {
                    const metadata = context.metadata.get(block.attachmentId);
                    if (metadata) result.attachments.push({ ...metadata });
                }
            },
        });
    }
    collectSource(range.source);
    for (const player of result.players) {
        const metadata = context.metadata.get(player.attachmentId);
        if (
            metadata &&
            !result.attachments.some(
                (item) => String(item.id) === player.attachmentId,
            )
        )
            result.attachments.push({ ...metadata });
    }
    return result;
}

export function cacheRichTransferPreviews(
    context: RichContext,
    previews: RichTransferPreviews,
) {
    for (const diagram of previews.diagrams) {
        const entry = context.mermaid.previews.prepareSource(diagram.source);
        if (entry.sanitized && entry.preview) continue;

        // Only prepared, sanitized output crosses panes; subscribers and save state stay local.

        entry.preview = { ...diagram.preview };
        entry.dimensions = diagram.dimensions && { ...diagram.dimensions };
        entry.sanitized = true;
        entry.state = 'ready';
    }
    for (const equation of previews.equations)
        cachePreparedMathPreview(
            {
                context,
                latex: equation.latex,
                displayMode: equation.displayMode,
            },
            { ...equation.preview },
        );
    for (const metadata of previews.attachments)
        context.metadata.set(String(metadata.id), { ...metadata });
}
