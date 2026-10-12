import type { EditorState } from '@codemirror/state';
import type { SyntaxNode } from '@lezer/common';
import {
    readOrbiumMetadata,
    serializeOrbiumBlock,
    type OrbiumMetadata,
} from '../dialect/metadata';
import type { RichCell, RichTable } from './rich-model';

function directiveMetadata(state: EditorState, node: SyntaxNode) {
    const header = node.getChild('OrbiumHeader');
    if (!header) return null;
    const source = state.sliceDoc(header.from, header.to);
    return readOrbiumMetadata(source.slice(source.indexOf('{')).trimEnd());
}

export function readRichTable(
    state: EditorState,
    node: SyntaxNode,
    rich: boolean,
): RichTable | null {
    const rows: RichCell[][] = [];
    const alignments: string[] = [];
    if (rich) {
        const body = node.getChild('Document');
        for (let row = body?.firstChild; row; row = row.nextSibling) {
            if (
                row.name !== 'OrbiumDirective' ||
                directiveMetadata(state, row)?.kind !== 'row'
            )
                return null;
            const cells: RichCell[] = [];
            for (
                let cell = row.getChild('Document')?.firstChild;
                cell;
                cell = cell.nextSibling
            ) {
                const metadata = directiveMetadata(state, cell);
                const opening = cell.getChild('OrbiumHeader');
                const close = cell.getChild('OrbiumClose');
                if (metadata?.kind !== 'cell' || !opening || !close)
                    return null;
                const from = Math.min(opening.to + 1, close.from);
                const to = Math.max(from, close.from - 1);
                cells.push({
                    from,
                    to,
                    source: state.sliceDoc(from, to),
                    metadata,
                });
            }
            rows.push(cells);
        }
    } else {
        for (let row = node.firstChild; row; row = row.nextSibling) {
            if (row.name === 'TableDelimiter') {
                const text = state
                    .sliceDoc(row.from, row.to)
                    .replace(/^\s*\||\|\s*$/g, '');
                alignments.push(
                    ...text
                        .split('|')
                        .map((column) =>
                            /^\s*:.*:\s*$/.test(column)
                                ? 'center'
                                : /:\s*$/.test(column)
                                  ? 'right'
                                  : /^\s*:/.test(column)
                                    ? 'left'
                                    : '',
                        ),
                );
                continue;
            }
            if (!['TableHeader', 'TableRow'].includes(row.name)) continue;
            const segments: { from: number; to: number }[] = [];
            const text = state.sliceDoc(row.from, row.to);
            let start = 0;
            let escaped = false;
            for (let index = 0; index < text.length; index++) {
                if (text[index] === '|' && !escaped) {
                    segments.push({ from: start, to: index });
                    start = index + 1;
                }
                escaped = text[index] === '\\' && !escaped;
            }
            segments.push({ from: start, to: text.length });
            if (/^\s*\|/.test(text)) segments.shift();
            if (
                segments.at(-1)!.from > 0 &&
                !text.slice(segments.at(-1)!.from).trim()
            )
                segments.pop();
            const cells: RichCell[] = segments.map((segment) => {
                const source = text.slice(segment.from, segment.to);
                const leading = source.length - source.trimStart().length;
                const trailing = source.length - source.trimEnd().length;
                const from = row.from + segment.from + leading;
                const to = Math.max(from, row.from + segment.to - trailing);
                return {
                    from,
                    to,
                    source: state.sliceDoc(from, to),
                    metadata: {
                        kind: 'cell',
                        header: row.name === 'TableHeader',
                    },
                };
            });
            rows.push(cells);
        }
        for (const row of rows)
            row.forEach((cell, index) => {
                if (alignments[index])
                    cell.metadata.align = alignments[
                        index
                    ] as OrbiumMetadata['align'];
            });
    }
    if (!validTable(rows)) return null;
    return { rows, alignments, rich };
}

export function validTable(rows: RichCell[][]): boolean {
    if (!rows.length || rows.length > 1000) return false;
    const grid = new Map<number, Set<number>>();
    const widths = new Map<number, number>();
    let maximum = 0;
    let coordinates = 0;
    for (let y = 0; y < rows.length; y++) {
        let x = 0;
        for (const cell of rows[y]) {
            const occupied = grid.get(y) ?? new Set<number>();
            while (occupied.has(x)) x++;
            const colspan = Number(cell.metadata.colspan ?? 1);
            const rowspan = Number(cell.metadata.rowspan ?? 1);
            if (
                y + rowspan > rows.length ||
                x + colspan > 1000 ||
                coordinates + rowspan * colspan > 10000
            )
                return false;
            for (let column = x; column < x + colspan; column++) {
                const width =
                    (cell.metadata.colwidth as number[] | undefined)?.[
                        column - x
                    ] ?? 0;
                if (width && widths.has(column) && widths.get(column) !== width)
                    return false;
                if (width) widths.set(column, width);
                for (let row = y; row < y + rowspan; row++) {
                    const values = grid.get(row) ?? new Set<number>();
                    if (values.has(column)) return false;
                    values.add(column);
                    grid.set(row, values);
                    coordinates++;
                }
            }
            x += colspan;
            maximum = Math.max(maximum, x);
        }
    }
    return (
        maximum > 0 &&
        rows.every((_, index) => grid.get(index)?.size === maximum)
    );
}

function escapePipe(source: string): string {
    let result = '';
    let backslashes = 0;
    for (const character of source) {
        if (character === '|' && backslashes % 2 === 0) result += '\\';
        result += character;
        backslashes = character === '\\' ? backslashes + 1 : 0;
    }
    return result;
}

export function canUseGfmTable(table: RichTable): boolean {
    return table.rows.every((row, rowIndex) =>
        row.every(
            (cell, column) =>
                Boolean(cell.metadata.header) === (rowIndex === 0) &&
                Number(cell.metadata.colspan ?? 1) === 1 &&
                Number(cell.metadata.rowspan ?? 1) === 1 &&
                !cell.metadata.colwidth &&
                !cell.source.includes('\n') &&
                cell.source === cell.source.trim() &&
                String(cell.metadata.align ?? '') ===
                    (table.alignments[column] ?? '') &&
                !/^\s*(?:#{1,6} |[-+*] |\d+[.)] |>|`{3,}|~{3,}|:{3,}orbium)/.test(
                    cell.source,
                ),
        ),
    );
}

export function serializeRichTable(
    table: RichTable,
    forceRich = false,
): string {
    if (!validTable(table.rows))
        throw new Error(
            'The table spans must form a complete rectangular grid.',
        );
    if (table.rich || forceRich || !canUseGfmTable(table)) {
        const body = table.rows
            .map((row) =>
                serializeOrbiumBlock(
                    { kind: 'row' },
                    row
                        .map((cell) =>
                            serializeOrbiumBlock(
                                { ...cell.metadata, kind: 'cell' },
                                cell.source,
                            ),
                        )
                        .join('\n\n'),
                ),
            )
            .join('\n\n');
        return serializeOrbiumBlock({ kind: 'table' }, body);
    }
    const rowSource = (row: RichCell[]) =>
        `| ${row.map((cell) => escapePipe(cell.source)).join(' | ')} |`;
    const delimiter = `| ${table.rows[0].map((_, index) => (table.alignments[index] === 'center' ? ':---:' : table.alignments[index] === 'right' ? '---:' : table.alignments[index] === 'left' ? ':---' : '---')).join(' | ')} |`;
    return [
        rowSource(table.rows[0]),
        delimiter,
        ...table.rows.slice(1).map(rowSource),
    ].join('\n');
}
