import type { OrbiumMetadata } from '../dialect/metadata';
import type { RichCell, RichTable } from './rich-model';
import { button, element } from './widget-controls';
import { widgetIcon } from './widget-icons';

const tableActionIcons = {
    'Add row': 'rowAdd',
    'Add column': 'columnAdd',
    'Delete row': 'rowDelete',
    'Delete column': 'columnDelete',
    'Toggle header': 'header',
    'Merge right': 'merge',
    'Split cell': 'split',
} as const;

function tableActionButton(
    label: keyof typeof tableActionIcons,
    action: () => void,
) {
    const control = button('', action);
    control.className =
        'rounded p-2 hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40';
    control.setAttribute('aria-label', label);
    control.title = label;
    control.append(widgetIcon(tableActionIcons[label], 16));
    control.addEventListener('mousedown', (event) => event.preventDefault());
    return control;
}
export const emptyTableCell = (header = false): RichCell => ({
    from: 0,
    to: 0,
    source: '',
    metadata: { kind: 'cell', header },
});

export function mountTableCellActions({
    host: actions,
    table,
    selected,
    editTable,
    hasSpans,
    onSelectCell,
}: {
    host: HTMLElement;
    table: () => RichTable;
    selected: () => Readonly<{ row: number; column: number }>;
    onSelectCell: (row: number, column: number) => void;
    editTable: (change: (table: RichTable) => void, rich?: boolean) => void;
    hasSpans: () => boolean;
}) {
    const structural: HTMLButtonElement[] = [];
    const spanHint = element(
        'p',
        'w-full px-2 py-1 text-xs text-muted-foreground',
        'Split spanning cells before adding or removing rows and columns.',
    );
    spanHint.hidden = true;
    actions.append(spanHint);
    function structuralButton(
        label: keyof typeof tableActionIcons,
        action: (next: RichTable) => void,
    ) {
        const control = tableActionButton(label, () => {
            if (!hasSpans()) editTable(action);
        });
        structural.push(control);
        actions.append(control);
    }
    structuralButton('Add row', (next) =>
        next.rows.splice(
            selected().row + 1,
            0,
            next.rows[0].map(() => emptyTableCell()),
        ),
    );
    structuralButton('Add column', (next) => {
        next.rows.forEach((row, index) =>
            row.splice(selected().column + 1, 0, emptyTableCell(index === 0)),
        );
        next.alignments.splice(selected().column + 1, 0, '');
    });
    structuralButton('Delete row', (next) => {
        if (next.rows.length > 1 && (next.rich || selected().row !== 0))
            next.rows.splice(selected().row, 1);
        onSelectCell(Math.max(0, selected().row - 1), selected().column);
    });
    structuralButton('Delete column', (next) => {
        if (next.rows[0].length > 1) {
            next.rows.forEach((row) => row.splice(selected().column, 1));
            next.alignments.splice(selected().column, 1);
            onSelectCell(selected().row, Math.max(0, selected().column - 1));
        }
    });
    const header = tableActionButton('Toggle header', () =>
        editTable((next) => {
            const cell = next.rows[selected().row]?.[selected().column];
            if (cell) cell.metadata.header = !cell.metadata.header;
        }, true),
    );
    actions.append(header);
    const merge = tableActionButton('Merge right', () =>
        editTable((next) => {
            const row = next.rows[selected().row];
            const first = row?.[selected().column];
            const second = row?.[selected().column + 1];
            if (
                !first ||
                !second ||
                Number(first.metadata.rowspan ?? 1) !== 1 ||
                Number(second.metadata.rowspan ?? 1) !== 1
            )
                return;
            first.source = [first.source, second.source]
                .filter(Boolean)
                .join('\n\n');
            const firstSpan = Number(first.metadata.colspan ?? 1);
            const secondSpan = Number(second.metadata.colspan ?? 1);
            first.metadata.colspan = firstSpan + secondSpan;
            const widths = [
                ...Array.from(
                    { length: firstSpan },
                    (_, index) => first.metadata.colwidth?.[index] ?? 0,
                ),
                ...Array.from(
                    { length: secondSpan },
                    (_, index) => second.metadata.colwidth?.[index] ?? 0,
                ),
            ];
            if (widths.some(Boolean)) first.metadata.colwidth = widths;
            row.splice(selected().column + 1, 1);
        }, true),
    );
    actions.append(merge);
    const split = tableActionButton('Split cell', () =>
        editTable((next) => {
            const row = next.rows[selected().row];
            const cell = row?.[selected().column];
            const span = Number(cell?.metadata.colspan ?? 1);
            if (!cell || span <= 1 || Number(cell.metadata.rowspan ?? 1) !== 1)
                return;
            const widths = cell.metadata.colwidth as number[] | undefined;
            cell.metadata.colspan = 1;
            if (widths) cell.metadata.colwidth = [widths[0]];
            const added = Array.from({ length: span - 1 }, (_, index) => {
                const item = emptyTableCell(Boolean(cell.metadata.header));
                if (widths) item.metadata.colwidth = [widths[index + 1]];
                return item;
            });
            row.splice(selected().column + 1, 0, ...added);
        }, true),
    );
    actions.append(split);
    const alignment = element(
        'select',
        'h-8 rounded border-0 bg-transparent px-2 text-xs hover:bg-accent',
    );
    alignment.setAttribute('aria-label', 'Cell alignment');
    for (const value of ['', 'left', 'center', 'right']) {
        const option = element('option', '', value || 'Default alignment');
        option.value = value;
        alignment.append(option);
    }
    alignment.addEventListener('change', () =>
        editTable((next) => {
            const cell = next.rows[selected().row]?.[selected().column];
            if (!cell) return;
            if (alignment.value)
                cell.metadata.align =
                    alignment.value as OrbiumMetadata['align'];
            else delete cell.metadata.align;
        }, true),
    );
    actions.append(alignment);
    const width = element(
        'input',
        'h-8 w-24 rounded border border-border bg-transparent px-2 text-xs hover:bg-accent',
    );
    width.type = 'number';
    width.min = '0';
    width.max = '2147483647';
    width.placeholder = 'Column width';
    width.setAttribute('aria-label', 'Column width in pixels');
    width.addEventListener('change', () => {
        if (
            hasSpans() ||
            !Number.isInteger(width.valueAsNumber) ||
            width.valueAsNumber < 0 ||
            width.valueAsNumber > 2147483647
        )
            return;
        editTable(
            (next) =>
                next.rows.forEach((row) => {
                    row[selected().column].metadata.colwidth = [
                        width.valueAsNumber,
                    ];
                }),
            true,
        );
    });
    actions.append(width);

    return {
        registerStructuralControl(control: HTMLButtonElement) {
            structural.push(control);
        },
        selectCell(row: number, column: number) {
            const cell = table().rows[row]?.[column];
            alignment.value = String(cell?.metadata.align ?? '');
            width.value = String(cell?.metadata.colwidth?.[0] ?? '');
        },
        update(disabled: boolean) {
            spanHint.hidden = !hasSpans();
            for (const control of structural) {
                control.disabled = disabled || hasSpans();
                control.title = hasSpans()
                    ? 'Split spanning cells before changing table structure.'
                    : (control.getAttribute('aria-label') ?? '');
            }
            header.disabled =
                merge.disabled =
                split.disabled =
                alignment.disabled =
                    disabled;
            width.disabled = disabled || hasSpans();
            width.title = hasSpans()
                ? 'Split spanning cells before changing column width.'
                : '';
        },
    };
}
