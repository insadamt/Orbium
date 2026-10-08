import { emptyTableCell, mountTableCellActions } from './table-cell-actions';
import { mountRichTextInput } from './rich-text-input';
import { widgetIcon } from './widget-icons';
import { EditorView } from '@codemirror/view';
import { serializeOrbiumBlock } from '../dialect/metadata';
import type {
    RichBlock,
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
        activeInput?.destroy();
        activeInput = null;
        activePosition = null;
        renderers.flat().forEach((renderer) => renderer.dispose?.());
    }
    const controls = sourceControls(mount, 'Table', false);
    controls.toolbar.hidden = true;
    mount.root.classList.add('group');
    const actions = element(
        'div',
        'glass-surface mb-2 flex max-w-full flex-wrap items-center gap-1 rounded-xl border border-border p-1 shadow-lg',
    );
    actions.hidden = true;
    const options = button('', () => {
        actions.hidden = !actions.hidden;
        options.setAttribute('aria-expanded', String(!actions.hidden));
    });
    options.setAttribute('aria-label', 'Table options');
    options.setAttribute('aria-expanded', 'false');
    options.className =
        'glass-surface mb-1 ms-auto block rounded-md border border-border p-1 shadow-sm';
    options.append(widgetIcon('more', 16));
    options.hidden = true;
    mount.root.append(options);
    controls.output.append(actions);
    const scroller = element('div', 'tableWrapper overflow-x-auto');
    const grid = element('table', 'orbium-table orbium-rich-table');
    const body = element('tbody');
    grid.append(body);
    scroller.append(grid);
    controls.output.append(scroller);
    const editors: HTMLElement[][] = [];
    let activeInput: ReturnType<typeof mountRichTextInput> | null = null;
    let activePosition: CellPosition | null = null;
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
    const cellActions = mountTableCellActions({
        host: actions,
        table: () => table,
        selected: () => selected,
        editTable,
        hasSpans,
        onSelectCell: setSelected,
    });
    function setSelected(row: number, column: number) {
        selected = { row, column };
        cellActions.selectCell(row, column);
    }
    function closeCell() {
        if (!activePosition) return;
        const { row, column } = activePosition;
        const input = editors[row]?.[column];
        activeInput?.destroy();
        activeInput = null;
        activePosition = null;
        if (input) {
            input.replaceChildren();
            input.hidden = true;
            input.previousElementSibling?.removeAttribute('hidden');
            refreshCell(row, column);
        }
    }
    const dismiss = (event: PointerEvent) => {
        if (mount.root.contains(event.target as Node)) return;
        closeCell();
        actions.hidden = options.hidden = true;
    };
    document.addEventListener('pointerdown', dismiss);
    const edges = element('div', 'pointer-events-none absolute inset-0 z-10');
    function edgeButton(
        label: string,
        action: (next: RichTable) => void,
        className: string,
    ) {
        const control = button('', () => {
            if (!hasSpans()) editTable(action);
        });
        control.setAttribute('aria-label', label);
        control.title = label;
        control.className = `table-edge-control ${className}`;
        control.append(widgetIcon('plus', 15));
        cellActions.registerStructuralControl(control);
        edges.append(control);
    }
    edgeButton(
        'Add row to table',
        (next) => next.rows.push(next.rows[0].map(() => emptyTableCell())),
        'orbium-table-add-row',
    );
    edgeButton(
        'Add column to table',
        (next) => {
            next.rows.forEach((row, index) =>
                row.push(emptyTableCell(index === 0)),
            );
            next.alignments.push('');
        },
        'orbium-table-add-column',
    );
    controls.output.append(edges);
    mount.root.addEventListener('orbium-edit-rich', () =>
        renderers[0]?.[0]?.output.click(),
    );
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
                const output = element('div', 'min-h-7 cursor-text');
                output.tabIndex = 0;
                output.setAttribute('role', 'button');
                output.setAttribute(
                    'aria-label',
                    `Edit row ${y + 1}, cell ${x + 1}`,
                );
                const input = element('div', 'min-h-7');
                input.hidden = true;
                editors[y][x] = input;
                renderers[y][x] = { output, source: '' };
                const open = () => {
                    if (!mount.view.state.facet(EditorView.editable)) return;
                    closeCell();
                    setSelected(y, x);
                    activePosition = { row: y, column: x };
                    input.hidden = false;
                    output.hidden = true;
                    options.hidden = false;
                    activeInput = mountRichTextInput({
                        host: input,
                        source: table.rows[y][x].source,
                        context: mount.context,
                        label: `Row ${y + 1}, cell ${x + 1}`,
                        onNotice: (message) => {
                            controls.error.textContent = message;
                            controls.error.hidden = !message;
                        },
                        onChange: (source) => {
                            const next = cloneTable(table);
                            next.rows[y][x].source = source;
                            write(next);
                        },
                    });
                    activeInput.focus();
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
                input.addEventListener('keydown', (event) => {
                    if (!(event.ctrlKey || event.metaKey))
                        event.stopPropagation();
                    if (event.key === 'Escape') {
                        event.preventDefault();
                        closeCell();
                        actions.hidden = true;
                        output.focus();
                    }
                    if (event.key !== 'Tab' || event.defaultPrevented) return;
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
                        closeCell();
                        actions.hidden = true;
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
            table.rows.map((row) =>
                row.map((cell, column) => ({
                    header: Boolean(cell.metadata.header),
                    colspan: Number(cell.metadata.colspan ?? 1),
                    rowspan: Number(cell.metadata.rowspan ?? 1),
                    widths: cell.metadata.colwidth ?? [],
                    alignment:
                        cell.metadata.align ?? table.alignments[column] ?? '',
                })),
            ),
        );
        if (key !== structure) {
            structure = key;
            rebuild();
        }
        const disabled = !mount.view.state.facet(EditorView.editable);
        cellActions.update(disabled);
        table.rows.forEach((row, y) =>
            row.forEach((cell, x) => {
                if (activePosition?.row === y && activePosition.column === x)
                    activeInput?.update(cell.source, disabled);
                else refreshCell(y, x);
            }),
        );
        return true;
    }
    update(block);
    return {
        update,
        destroy() {
            controls.destroy();
            disposeCells();
            document.removeEventListener('pointerdown', dismiss);
        },
    };
}
