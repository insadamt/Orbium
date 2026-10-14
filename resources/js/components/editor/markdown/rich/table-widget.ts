import { mountTableFullscreenView } from './table-fullscreen-view';
import { mountTableColumnMenu } from './table-column-menu';
import { emptyTableCell } from './table-cell-actions';
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
    const frame = element('div', 'orbium-table-frame');
    const scroller = element('div', 'tableWrapper overflow-x-auto');
    const grid = element('table', 'orbium-table orbium-rich-table');
    const body = element('tbody');
    grid.append(body);
    scroller.append(grid);
    frame.append(scroller);
    controls.output.append(frame);
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
        if (!mount.view.state.facet(EditorView.editable)) return false;
        const next = cloneTable(table);
        change(next);
        return write(next, rich);
    }
    const columnMenu = mountTableColumnMenu({
        grid,
        view: mount.view,
        table: () => table,
        hasSpans,
        editTable,
        beforeAction: () => {
            closeCell();
        },
    });
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
        if (
            mount.root.contains(event.target as Node) ||
            activeInput?.containsFormattingTarget(event.target as Node) ||
            columnMenu.contains(event.target as Node)
        )
            return;
        closeCell();
        columnMenu.close();
    };
    document.addEventListener('pointerdown', dismiss);
    const edges = element('div', 'orbium-table-edges');
    function revealLastColumn() {
        mount.view.requestMeasure({
            key: scroller,
            read: () => {
                const lastCell = body.rows[0]?.lastElementChild;
                if (!scroller.isConnected || !lastCell) return null;
                const cellBounds = lastCell.getBoundingClientRect();
                const visibleLeft =
                    scroller.getBoundingClientRect().left + scroller.clientLeft;
                const visibleRight = visibleLeft + scroller.clientWidth;
                const offset =
                    cellBounds.right > visibleRight
                        ? cellBounds.right - visibleRight
                        : Math.min(0, cellBounds.left - visibleLeft);
                return scroller.scrollLeft + offset;
            },
            write: (left) => {
                if (left !== null && scroller.isConnected)
                    scroller.scrollTo({ left, behavior: 'instant' });
            },
        });
    }
    function edgeButton(
        label: string,
        action: (next: RichTable) => void,
        className: string,
        afterEdit?: () => void,
    ) {
        const control = button('', () => {
            if (!hasSpans() && editTable(action)) afterEdit?.();
        });
        control.setAttribute('aria-label', label);
        control.title = label;
        control.className = `table-edge-control ${className}`;
        control.append(widgetIcon('plus', 15));
        control.disabled =
            hasSpans() || !mount.view.state.facet(EditorView.editable);
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
        revealLastColumn,
    );
    const fullscreenView = mountTableFullscreenView({
        edges,
        grid,
        beforeOpen: () => {
            closeCell();
            columnMenu.close();
        },
    });
    frame.append(edges);
    mount.root.addEventListener('orbium-edit-rich', () =>
        renderers[0]?.[0]?.output.click(),
    );
    function rebuild() {
        disposeCells();
        columnMenu.clearHeaderControls();
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
                const content = element('div', 'orbium-table-cell-content');
                input.hidden = true;
                editors[y][x] = input;
                renderers[y][x] = { output, source: '' };
                const open = () => {
                    if (!mount.view.state.facet(EditorView.editable)) return;
                    closeCell();
                    activePosition = { row: y, column: x };
                    input.hidden = false;
                    output.hidden = true;
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
                        mount.view.focus();
                    }
                });
                content.append(output, input);
                td.append(content);
                tr.append(td);
                if (y === 0) columnMenu.attach(td, x);
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
        for (const control of edges.querySelectorAll<HTMLButtonElement>(
            'button:not(.orbium-table-fullscreen-trigger)',
        )) {
            control.disabled = disabled || hasSpans();
            control.title = hasSpans()
                ? 'Split spanning cells before changing table structure.'
                : (control.getAttribute('aria-label') ?? '');
        }
        columnMenu.refreshSortIndicator();
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
            fullscreenView.destroy();
            controls.destroy();
            columnMenu.destroy();
            disposeCells();
            document.removeEventListener('pointerdown', dismiss);
        },
    };
}
