import { emptyTableCell } from './table-cell-actions';
import type { RichTable } from './rich-model';

export type TableAxis = 'row' | 'column';

export function restoreMarkdownTableHeaders(table: RichTable) {
    if (table.rich) return;
    table.rows.forEach((row, index) =>
        row.forEach((cell) => {
            cell.metadata.header = index === 0;
        }),
    );
}

export function insertTableRow(table: RichTable, index: number) {
    const reference = table.rows[Math.min(index, table.rows.length - 1)];
    const row = reference.map((cell) => {
        const added = emptyTableCell(index === 0);
        if (cell.metadata.align) added.metadata.align = cell.metadata.align;
        if (cell.metadata.colwidth)
            added.metadata.colwidth = [...cell.metadata.colwidth];
        return added;
    });
    table.rows.splice(index, 0, row);
    restoreMarkdownTableHeaders(table);
}

export function moveTableAxis(
    table: RichTable,
    axis: TableAxis,
    from: number,
    to: number,
) {
    const length = axis === 'row' ? table.rows.length : table.rows[0].length;
    if (from === to || from < 0 || to < 0 || from >= length || to >= length)
        return;
    if (axis === 'row') {
        table.rows.splice(to, 0, table.rows.splice(from, 1)[0]);
        restoreMarkdownTableHeaders(table);
        return;
    }
    table.rows.forEach((row) => row.splice(to, 0, row.splice(from, 1)[0]));
    const alignment = table.alignments.splice(from, 1)[0] ?? '';
    table.alignments.splice(to, 0, alignment);
}
