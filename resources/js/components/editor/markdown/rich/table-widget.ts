import { EditorView } from '@codemirror/view';
import { serializeOrbiumBlock, type OrbiumMetadata } from '../dialect/metadata';
import type {
    RichBlock,
    RichCell,
    RichController,
    RichTable,
    RichWidgetMount,
} from './rich-model';
import { serializeRichTable, canUseGfmTable } from './rich-table-source';
import { renderRichBody } from './render-rich-body';
import {
    applyRichSource,
    button,
    element,
    preservePresentation,
    sourceControls,
} from './widget-controls';

type CellPosition = { row: number; column: number };
const emptyCell = (header = false): RichCell => ({
    from: 0,
    to: 0,
    source: '',
    metadata: { kind: 'cell', header },
});
const cloneTable = (table: RichTable): RichTable => ({
    ...table,
    alignments: [...table.alignments],
    rows: table.rows.map((row) =>
        row.map((cell) => ({ ...cell, metadata: { ...cell.metadata } })),
    ),
});

export function mountTable(mount: RichWidgetMount): RichController {
    let block = mount.block;
    let table = block.table!;
    let selected: CellPosition = { row: 0, column: 0 };
    let structure = '';
    function disposeCells() {
        renderers.flat().forEach((renderer) => renderer.dispose?.());
    }
    const controls = sourceControls(mount, 'Table');
    const actions = element('div', 'mb-3 flex flex-wrap items-center gap-2');
    controls.output.append(actions);
    const scroller = element('div', 'overflow-x-auto');
    const grid = element('table', 'orbium-table orbium-rich-table w-full');
    const body = element('tbody');
    grid.append(body);
    scroller.append(grid);
    controls.output.append(scroller);
    const editors: HTMLTextAreaElement[][] = [];
    const renderers: {
        output: HTMLElement;
        source: string;
        dispose?: () => void;
    }[][] = [];
    function write(next: RichTable, forceRich = false) {
        try {
            next.rich = next.rich || forceRich || !canUseGfmTable(next);
            const source = preservePresentation(
                block,
                serializeRichTable(next, forceRich),
                serializeOrbiumBlock,
            );
            if (!applyRichSource(mount.view, block, source))
                throw new Error(
                    'The table changed elsewhere. Reopen the block before editing.',
                );
            block = {
                ...block,
                source,
                to: block.from + source.length,
                table: next,
            };
            table = next;
            return true;
        } catch (error) {
            controls.error.textContent =
                error instanceof Error
                    ? error.message
                    : 'Could not update this table.';
            controls.error.hidden = false;
            return false;
        }
    }
    function hasSpans() {
        return table.rows.some((row) =>
            row.some(
                (cell) =>
                    Number(cell.metadata.colspan ?? 1) !== 1 ||
                    Number(cell.metadata.rowspan ?? 1) !== 1,
            ),
        );
    }
    function editTable(change: (next: RichTable) => void, rich = false) {
        if (!mount.view.state.facet(EditorView.editable)) return;
        const next = cloneTable(table);
        change(next);
        write(next, rich);
    }
    const structural: HTMLButtonElement[] = [];
    function structuralButton(
        label: string,
        action: (next: RichTable) => void,
    ) {
        const control = button(label, () => {
            if (!hasSpans()) editTable(action);
        });
        structural.push(control);
        actions.append(control);
    }
    structuralButton('Add row', (next) =>
        next.rows.splice(
            selected.row + 1,
            0,
            next.rows[0].map(() => emptyCell()),
        ),
    );
    structuralButton('Add column', (next) => {
        next.rows.forEach((row, index) =>
            row.splice(selected.column + 1, 0, emptyCell(index === 0)),
        );
        next.alignments.splice(selected.column + 1, 0, '');
    });
    structuralButton('Delete row', (next) => {
        if (next.rows.length > 1 && (next.rich || selected.row !== 0))
            next.rows.splice(selected.row, 1);
        selected.row = Math.max(0, selected.row - 1);
    });
    structuralButton('Delete column', (next) => {
        if (next.rows[0].length > 1) {
            next.rows.forEach((row) => row.splice(selected.column, 1));
            next.alignments.splice(selected.column, 1);
            selected.column = Math.max(0, selected.column - 1);
        }
    });
    const header = button('Toggle header', () =>
        editTable((next) => {
            const cell = next.rows[selected.row]?.[selected.column];
            if (cell) cell.metadata.header = !cell.metadata.header;
        }, true),
    );
    actions.append(header);
    const merge = button('Merge right', () =>
        editTable((next) => {
            const row = next.rows[selected.row];
            const first = row?.[selected.column];
            const second = row?.[selected.column + 1];
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
            row.splice(selected.column + 1, 1);
        }, true),
    );
    actions.append(merge);
    const split = button('Split cell', () =>
        editTable((next) => {
            const row = next.rows[selected.row];
            const cell = row?.[selected.column];
            const span = Number(cell?.metadata.colspan ?? 1);
            if (!cell || span <= 1 || Number(cell.metadata.rowspan ?? 1) !== 1)
                return;
            const widths = cell.metadata.colwidth as number[] | undefined;
            cell.metadata.colspan = 1;
            if (widths) cell.metadata.colwidth = [widths[0]];
            const added = Array.from({ length: span - 1 }, (_, index) => {
                const item = emptyCell(Boolean(cell.metadata.header));
                if (widths) item.metadata.colwidth = [widths[index + 1]];
                return item;
            });
            row.splice(selected.column + 1, 0, ...added);
        }, true),
    );
    actions.append(split);
    const alignment = element(
        'select',
        'rounded-md bg-muted px-2 py-1 text-xs',
    );
    alignment.setAttribute('aria-label', 'Cell alignment');
    for (const value of ['', 'left', 'center', 'right']) {
        const option = element('option', '', value || 'Default alignment');
        option.value = value;
        alignment.append(option);
    }
    alignment.addEventListener('change', () =>
        editTable((next) => {
            const cell = next.rows[selected.row]?.[selected.column];
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
        'w-28 rounded-md bg-muted px-2 py-1 text-xs',
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
                    row[selected.column].metadata.colwidth = [
                        width.valueAsNumber,
                    ];
                }),
            true,
        );
    });
    actions.append(width);
    function setSelected(row: number, column: number) {
        selected = { row, column };
        const cell = table.rows[row]?.[column];
        alignment.value = String(cell?.metadata.align ?? '');
        width.value = String(
            (cell?.metadata.colwidth as number[] | undefined)?.[0] ?? '',
        );
    }
    function rebuild() {
        disposeCells();
        editors.length = 0;
        renderers.length = 0;
        body.replaceChildren();
        table.rows.forEach((row, y) => {
            const tr = element('tr');
            body.append(tr);
            editors[y] = [];
            renderers[y] = [];
            row.forEach((cell, x) => {
                const td = element(
                    cell.metadata.header ? 'th' : 'td',
                    'align-top',
                );
                td.colSpan = Number(cell.metadata.colspan ?? 1);
                td.rowSpan = Number(cell.metadata.rowspan ?? 1);
                td.style.textAlign = String(cell.metadata.align ?? '');
                const widths = cell.metadata.colwidth as number[] | undefined;
                if (widths?.some(Boolean))
                    td.style.width = `${widths.reduce((sum, value) => sum + value, 0)}px`;
                const output = element('div', 'min-h-8 cursor-text p-2');
                output.tabIndex = 0;
                output.setAttribute('role', 'button');
                output.setAttribute(
                    'aria-label',
                    `Edit row ${y + 1}, cell ${x + 1}`,
                );
                const input = element(
                    'textarea',
                    'min-h-12 w-full resize-y bg-transparent p-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
                );
                input.setAttribute(
                    'aria-label',
                    `Row ${y + 1}, cell ${x + 1} Markdown`,
                );
                input.value = cell.source;
                input.rows = 2;
                input.hidden = true;
                editors[y][x] = input;
                renderers[y][x] = { output, source: '' };
                const open = () => {
                    if (!mount.view.state.facet(EditorView.editable)) return;
                    setSelected(y, x);
                    input.hidden = false;
                    output.hidden = true;
                    input.value = table.rows[y][x].source;
                    input.focus();
                    mount.view.requestMeasure();
                };
                output.addEventListener('click', open);
                output.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        event.stopPropagation();
                        open();
                    }
                });
                input.addEventListener('focus', () => setSelected(y, x));
                input.addEventListener('blur', () => {
                    input.hidden = true;
                    output.hidden = false;
                    refreshCell(y, x);
                    mount.view.requestMeasure();
                });
                input.addEventListener('input', () => {
                    const next = cloneTable(table);
                    next.rows[y][x].source = input.value;
                    write(next);
                });
                input.addEventListener('keydown', (event) => {
                    if (!(event.ctrlKey || event.metaKey))
                        event.stopPropagation();
                    if (event.key === 'Escape') {
                        event.preventDefault();
                        input.blur();
                        output.focus();
                    }
                    if (event.key !== 'Tab') return;
                    event.preventDefault();
                    const flat = editors.flat();
                    const index =
                        flat.indexOf(input) + (event.shiftKey ? -1 : 1);
                    const next = flat[index];
                    if (next)
                        next.previousElementSibling?.dispatchEvent(
                            new MouseEvent('click'),
                        );
                    else {
                        input.blur();
                        mount.view.focus();
                    }
                });
                td.append(output, input);
                tr.append(td);
            });
        });
    }
    function refreshCell(y: number, x: number) {
        const cell = table.rows[y][x];
        const renderer = renderers[y][x];
        if (renderer.source === cell.source && renderer.dispose) return;
        renderer.dispose?.();
        renderer.source = cell.source;
        renderer.dispose = renderRichBody(
            renderer.output,
            cell.source.replace(/\\\|/g, '|'),
            mount.context,
            () => mount.view.requestMeasure(),
        );
    }
    function update(next: RichBlock) {
        block = next;
        table = next.table!;
        controls.update(next);
        const key = JSON.stringify(
            table.rows.map((row) => row.map((cell) => cell.metadata)),
        );
        if (key !== structure) {
            structure = key;
            rebuild();
        }
        const disabled = !mount.view.state.facet(EditorView.editable);
        for (const control of structural) {
            control.disabled = disabled || hasSpans();
            control.title = hasSpans()
                ? 'Split spanning cells before changing table structure.'
                : '';
        }
        header.disabled =
            merge.disabled =
            split.disabled =
            alignment.disabled =
                disabled;
        width.disabled = disabled || hasSpans();
        table.rows.forEach((row, y) =>
            row.forEach((cell, x) => {
                const input = editors[y][x];
                input.readOnly = disabled;
                if (input.value !== cell.source) input.value = cell.source;
                if (document.activeElement !== input) refreshCell(y, x);
            }),
        );
        return true;
    }
    update(block);
    return { update, destroy: disposeCells };
}
