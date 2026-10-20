import {
    createTableMenuSurface,
    type TableMenuAction,
} from './table-menu-surface';
import { EditorView } from '@codemirror/view';
import type { RichTable } from './rich-model';
import { bindRichBlockHistory, element } from './widget-controls';
import { widgetIcon } from './widget-icons';
import { mountTableReordering } from './table-reordering';
import {
    insertTableRow,
    moveTableAxis,
    restoreMarkdownTableHeaders,
    type TableAxis,
} from './table-structure';

type TableAxisMenuOptions = {
    onHistory?: (direction: 'undo' | 'redo') => void;
    grid: HTMLTableElement;
    view: EditorView;
    table: () => RichTable;
    hasSpans: () => boolean;
    beforeAction: () => void;
    editTable: (change: (table: RichTable) => void, rich?: boolean) => void;
};

export function mountTableAxisMenu(options: TableAxisMenuOptions) {
    const { grid, view, hasSpans, editTable } = options;
    let activeSort: { column: number; direction: number } | null = null;
    let sortedSources = '';
    const headerControls = new Map<
        number,
        { cell: HTMLTableCellElement; indicator: HTMLElement }
    >();
    function bodySources() {
        return JSON.stringify(
            options
                .table()
                .rows.slice(1)
                .map((row) => row.map((cell) => cell.source)),
        );
    }
    function refreshSortIndicator() {
        if (activeSort && bodySources() !== sortedSources) activeSort = null;
        for (const [column, { cell, indicator }] of headerControls) {
            const direction =
                activeSort?.column === column ? activeSort.direction : null;
            indicator.hidden = direction === null;
            indicator.replaceChildren();
            cell.removeAttribute('aria-sort');
            if (direction === null) continue;
            const label = direction === 1 ? 'ascending' : 'descending';
            cell.setAttribute('aria-sort', label);
            indicator.title = `Sorted ${label}`;
            indicator.setAttribute('aria-label', `Sorted ${label}`);
            indicator.append(
                widgetIcon(
                    direction === 1 ? 'sortAscending' : 'sortDescending',
                    14,
                ),
            );
        }
    }
    let anchor: HTMLButtonElement | null = null;
    const menu = element('div');
    const menuSurface = createTableMenuSurface(menu);
    let actions: TableMenuAction[] = [];
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', 'Column options');
    menu.hidden = true;
    grid.ownerDocument.body.append(menu);
    bindRichBlockHistory(menu, view, options.onHistory);
    function close(restoreFocus = false) {
        menu.hidden = true;
        menuSurface.close();
        anchor?.setAttribute('aria-expanded', 'false');
        grid.querySelectorAll('.orbium-table-axis-selected').forEach((cell) =>
            cell.classList.remove('orbium-table-axis-selected'),
        );
        window.removeEventListener('scroll', closeOnScroll, true);
        window.removeEventListener('resize', closeOnScroll);
        if (restoreFocus) {
            if (anchor?.isConnected && !anchor.closest('[hidden]'))
                anchor.focus({ preventScroll: true });
            else view.focus();
        }
    }
    function moveAxis(axis: TableAxis, from: number, to: number) {
        if (hasSpans() || !view.state.facet(EditorView.editable)) return;
        options.beforeAction();
        activeSort = null;
        editTable((next) => moveTableAxis(next, axis, from, to));
        refreshSortIndicator();
        view.focus();
    }
    const reordering = mountTableReordering({
        grid,
        canMove: () => !hasSpans() && view.state.facet(EditorView.editable),
        beforeMove: () => {
            close();
            options.beforeAction();
        },
        onMove: moveAxis,
    });
    const closeOnScroll = () => close();
    function addAction(
        label: string,
        icon: Parameters<typeof widgetIcon>[0],
        action: () => void,
        disabled = false,
    ) {
        actions.push({
            label,
            icon,
            disabled,
            run: () => {
                options.beforeAction();
                action();
                close(true);
            },
        });
    }

    function addRowActions(row: number, disabled: boolean) {
        addAction(
            'Insert above',
            'rowAdd',
            () => {
                editTable((next) => insertTableRow(next, row));
            },
            disabled,
        );
        addAction(
            'Insert below',
            'rowAdd',
            () => {
                editTable((next) => insertTableRow(next, row + 1));
            },
            disabled,
        );
        addAction(
            'Move up',
            'sortAscending',
            () => reordering.animateMove('row', row, row - 1),
            disabled || row === 0,
        );
        addAction(
            'Move down',
            'sortDescending',
            () => reordering.animateMove('row', row, row + 1),
            disabled || row === options.table().rows.length - 1,
        );
        addAction(
            'Delete row',
            'rowDelete',
            () => {
                if (hasSpans() || options.table().rows.length <= 1) return;
                activeSort = null;
                editTable((next) => {
                    next.rows.splice(row, 1);
                    restoreMarkdownTableHeaders(next);
                });
            },
            disabled || options.table().rows.length <= 1,
        );
    }
    function open(trigger: HTMLButtonElement, column: number, axis: TableAxis) {
        const wasOpen = anchor === trigger && !menu.hidden;
        close();
        if (wasOpen) return;
        options.beforeAction();
        anchor = trigger;
        actions = [];
        const readOnly = !view.state.facet(EditorView.editable);
        const structuralDisabled = readOnly || hasSpans();
        menu.setAttribute(
            'aria-label',
            axis === 'column' ? 'Column options' : 'Row options',
        );
        function sort(direction: number) {
            editTable((next) => {
                const rows = next.rows.slice(1);
                rows.sort(
                    (left, right) =>
                        direction *
                        left[column].source.localeCompare(
                            right[column].source,
                            undefined,
                            { numeric: true, sensitivity: 'base' },
                        ),
                );
                next.rows = [next.rows[0], ...rows];
            });
            const rows = options.table().rows.slice(1);
            const isSorted = rows.every(
                (row, index) =>
                    index === 0 ||
                    direction *
                        rows[index - 1][column].source.localeCompare(
                            row[column].source,
                            undefined,
                            { numeric: true, sensitivity: 'base' },
                        ) <=
                        0,
            );
            if (isSorted) {
                activeSort = { column, direction };
                sortedSources = bodySources();
                refreshSortIndicator();
            }
        }
        if (axis === 'row') addRowActions(column, structuralDisabled);
        else {
            addAction(
                'Sort ascending',
                'sortAscending',
                () => sort(1),
                structuralDisabled,
            );
            addAction(
                'Sort descending',
                'sortDescending',
                () => sort(-1),
                structuralDisabled,
            );
            const rtl =
                grid.ownerDocument.defaultView?.getComputedStyle(grid)
                    .direction === 'rtl';
            const left = column + (rtl ? 1 : -1);
            const right = column + (rtl ? -1 : 1);
            const count = options.table().rows[0].length;
            addAction(
                'Move left',
                'arrowLeft',
                () => reordering.animateMove('column', column, left),
                structuralDisabled || left < 0 || left >= count,
            );
            addAction(
                'Move right',
                'arrowRight',
                () => reordering.animateMove('column', column, right),
                structuralDisabled || right < 0 || right >= count,
            );
            addAction(
                'Delete column',
                'columnDelete',
                () => {
                    if (hasSpans() || options.table().rows[0].length <= 1)
                        return;
                    editTable((next) => {
                        next.rows.forEach((row) => row.splice(column, 1));
                        next.alignments.splice(column, 1);
                    });
                    activeSort = null;
                    refreshSortIndicator();
                    view.focus();
                },
                structuralDisabled || options.table().rows[0].length <= 1,
            );
        }
        const selected =
            axis === 'row'
                ? Array.from(grid.rows[column].cells)
                : Array.from(grid.rows).flatMap((row) =>
                      row.cells[column] ? [row.cells[column]] : [],
                  );
        selected.forEach((cell) =>
            cell.classList.add('orbium-table-axis-selected'),
        );
        menu.hidden = false;
        trigger.setAttribute('aria-expanded', 'true');
        menuSurface.open(
            trigger,
            axis === 'column' ? 'Column options' : 'Row options',
            actions,
            () => close(true),
        );
    }
    const dismiss = (event: PointerEvent) => {
        if (
            !(
                event.target instanceof Element &&
                event.target.closest('.orbium-table-action-menu')
            ) &&
            !menu.contains(event.target as Node) &&
            !anchor?.contains(event.target as Node)
        )
            close();
    };
    grid.ownerDocument.addEventListener('pointerdown', dismiss);
    menu.addEventListener('keydown', (event) => {
        event.stopPropagation();
        if (event.key === 'Escape') {
            event.preventDefault();
            close(true);
        }
    });
    function createHandle(axis: TableAxis, index: number) {
        const trigger = element(
            'button',
            `orbium-table-axis-handle orbium-table-${axis}-handle`,
        );
        trigger.type = 'button';
        trigger.title = `${axis === 'column' ? 'Column' : 'Row'} ${index + 1}: click for options, drag to move`;
        trigger.setAttribute(
            'aria-label',
            `Options for ${axis} ${index + 1}. Drag to move.`,
        );
        trigger.setAttribute('aria-haspopup', 'menu');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.append(element('span', 'orbium-table-handle-dash'));
        reordering.bindHandle(trigger, axis, index);
        trigger.addEventListener('click', () => open(trigger, index, axis));
        return trigger;
    }
    return {
        contains: (target: Node) =>
            menu.contains(target) ||
            (target instanceof Element &&
                Boolean(target.closest('.orbium-table-action-menu'))),
        close,
        refreshSortIndicator,
        clearHeaderControls() {
            reordering.cancel();
            close();
            headerControls.clear();
        },
        attach(cell: HTMLTableCellElement, column: number) {
            const trigger = createHandle('column', column);
            const indicator = element('span', 'orbium-table-sort-indicator');
            indicator.hidden = true;
            const header = element('div', 'orbium-table-column-header');
            header.append(...Array.from(cell.childNodes), indicator);
            cell.append(header, trigger);
            headerControls.set(column, { cell, indicator });
        },
        attachRow(cell: HTMLTableCellElement, row: number) {
            cell.append(createHandle('row', row));
        },
        destroy() {
            reordering.destroy();
            close();
            menuSurface.destroy();
            menu.remove();
            grid.ownerDocument.removeEventListener('pointerdown', dismiss);
        },
    };
}
