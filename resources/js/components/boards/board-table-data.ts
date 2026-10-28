import { serializeInlineIcon } from '@/components/inline-icons/markdown-icon-source';
import { EditorState } from '@codemirror/state';
import { markdownLanguage } from '@codemirror/lang-markdown';
import type { MarkdownParser } from '@lezer/markdown';
import { orbiumMarkdownDialect } from '@/components/editor/markdown/dialect/markdown-dialect';
import { readRichBlock } from '@/components/editor/markdown/rich/read-rich-block';
import { serializeRichTable } from '@/components/editor/markdown/rich/rich-table-source';
import type { BoardBlockData, BoardInline } from './board-types';

const tableParser = (markdownLanguage.parser as MarkdownParser).configure(
    orbiumMarkdownDialect,
);

function inlineMarkdown(content: BoardInline[]): string {
    return content
        .map((node) => {
            if (node.type === 'hardBreak') return '  \n';
            const raw = node.text ?? '';
            const attrs = node.attrs;
            const icon =
                node.type === 'inlineIcon' && attrs
                    ? serializeInlineIcon(
                          attrs.kind === 'custom'
                              ? {
                                    kind: 'custom',
                                    label: attrs.label,
                                    attachmentId: attrs.attachmentId!,
                                }
                              : {
                                    kind: 'builtin',
                                    label: attrs.label,
                                    name: attrs.name!,
                                },
                      )
                    : undefined;
            const code = node.marks?.some((mark) => mark.type === 'code');
            const fence = '`'.repeat(
                Math.max(
                    0,
                    ...(raw.match(/`+/g) ?? []).map((run) => run.length),
                ) + 1,
            );
            let text =
                icon ??
                (code
                    ? `${fence} ${raw} ${fence}`
                    : raw.replace(/[\\`*_[\]<>~#$!:]/g, '\\$&'));
            for (const mark of node.marks ?? []) {
                if (mark.type === 'bold') text = `**${text}**`;
                if (mark.type === 'italic') text = `*${text}*`;
                if (mark.type === 'strike') text = `~~${text}~~`;
                if (mark.type === 'link')
                    text = `[${text}](<${(mark.attrs?.href ?? '').replace(/[<>\\]/g, encodeURIComponent)}>)`;
                if (mark.type === 'underline' || mark.type === 'textColor')
                    text = `:orbium[${text}]${JSON.stringify(mark.type === 'underline' ? { underline: true } : { color: mark.attrs?.color?.toLowerCase() })}`;
            }
            return text;
        })
        .join('');
}

export function boardTableSource(data: BoardBlockData): string {
    if (data.table_source !== undefined) return data.table_source;
    return serializeRichTable({
        rich: true,
        alignments: [],
        rows: data.rows!.map((row, index) =>
            row.map((cell) => ({
                from: 0,
                to: 0,
                source: inlineMarkdown(cell),
                metadata: { kind: 'cell', header: index === 0 },
            })),
        ),
    });
}

export function readBoardTable(source: string) {
    const state = EditorState.create({ doc: source });
    const node = tableParser.parse(source).topNode.firstChild;
    if (
        !node ||
        node.nextSibling ||
        node.from !== 0 ||
        node.to !== source.length
    )
        return null;
    const block = readRichBlock(state, node);
    if (block?.kind !== 'table' || !block.table) return null;
    if (
        block.table.rows.length > 100 ||
        block.table.rows.some(
            (row) =>
                row.reduce(
                    (width, cell) => width + Number(cell.metadata.colspan ?? 1),
                    0,
                ) > 30,
        )
    )
        return null;
    return block;
}

export function boardTableData(
    data: BoardBlockData,
    source: string,
): BoardBlockData | null {
    const block = readBoardTable(source);
    if (!block?.table) return null;
    //
    // Keep a rectangular text projection for existing Board clipboard and recovery consumers; the Document source retains rich cell content.
    //
    return {
        ...data,
        table_source: source,
        rows: block.table.rows.map((row) =>
            row.map((cell) =>
                cell.source ? [{ type: 'text', text: cell.source }] : [],
            ),
        ),
    };
}
