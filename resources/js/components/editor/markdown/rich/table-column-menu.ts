import { EditorView } from '@codemirror/view';
import type { RichTable } from './rich-model';
import { bindRichBlockHistory, button, element } from './widget-controls';
import { widgetIcon } from './widget-icons';

type ColumnMenuOptions = {
    grid: HTMLTableElement;
    view: EditorView;
    table: () => RichTable;
    hasSpans: () => boolean;
    beforeAction: () => void;
    editTable: (change: (table: RichTable) => void, rich?: boolean) => void;
};

export function mountTableColumnMenu(options: ColumnMenuOptions) {
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
    const menu = element(
        'div',
        'orbium-table-column-menu orbium-editor-toolbar glass-surface',
    );
    menu.setAttribute('role', 'dialog');
    menu.setAttribute('aria-label', 'Column options');
    menu.hidden = true;
    grid.ownerDocument.body.append(menu);
    bindRichBlockHistory(menu, view);
    function close(restoreFocus = false) {
        menu.hidden = true;
        anchor?.setAttribute('aria-expanded', 'false');
        window.removeEventListener('scroll', closeOnScroll, true);
        window.removeEventListener('resize', closeOnScroll);
        if (restoreFocus && anchor?.isConnected && !anchor.closest('[hidden]'))
            anchor.focus({ preventScroll: true });
    }
    const closeOnScroll = () => close();
    function addAction(
        label: string,
        icon: Parameters<typeof widgetIcon>[0],
        action: () => void,
        disabled = false,
    ) {
        const control = button('', () => {
            options.beforeAction();
            action();
            close(true);
        });
        control.className = 'orbium-table-column-action';
        control.append(widgetIcon(icon, 15), element('span', '', label));
        control.disabled = disabled;
        menu.append(control);
    }
    function open(trigger: HTMLButtonElement, column: number) {
        const wasOpen = anchor === trigger && !menu.hidden;
        close();
        if (wasOpen) return;
        anchor = trigger;
        menu.replaceChildren();
        const readOnly = !view.state.facet(EditorView.editable);
        const structuralDisabled = readOnly || hasSpans();
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
        addAction(
            'Delete column',
            'columnDelete',
            () => {
                if (hasSpans() || options.table().rows[0].length <= 1) return;
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
        menu.hidden = false;
        trigger.setAttribute('aria-expanded', 'true');
        view.requestMeasure({
            key: menu,
            read: () => ({
                anchor: trigger.getBoundingClientRect(),
                menu: menu.getBoundingClientRect(),
            }),
            write: (bounds) => {
                if (menu.hidden) return;
                menu.style.left = `${Math.max(12, Math.min(bounds.anchor.left, window.innerWidth - bounds.menu.width - 12))}px`;
                const top = bounds.anchor.bottom + 4;
                menu.style.top = `${Math.max(12, Math.min(top, window.innerHeight - bounds.menu.height - 12))}px`;
            },
        });
        window.addEventListener('scroll', closeOnScroll, true);
        window.addEventListener('resize', closeOnScroll);
        menu.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus({
            preventScroll: true,
        });
    }
    const dismiss = (event: PointerEvent) => {
        if (
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
    return {
        contains: (target: Node) => menu.contains(target),
        close,
        refreshSortIndicator,
        clearHeaderControls() {
            headerControls.clear();
        },
        attach(cell: HTMLTableCellElement, column: number) {
            const trigger = button('', () => open(trigger, column));
            trigger.className = 'orbium-table-column-trigger';
            trigger.setAttribute(
                'aria-label',
                `Options for column ${column + 1}`,
            );
            trigger.setAttribute('aria-haspopup', 'dialog');
            trigger.setAttribute('aria-expanded', 'false');
            trigger.append(widgetIcon('more', 14));
            const indicator = element('span', 'orbium-table-sort-indicator');
            indicator.hidden = true;
            const header = element('div', 'orbium-table-column-header');
            header.append(...Array.from(cell.childNodes), indicator, trigger);
            cell.append(header);
            headerControls.set(column, { cell, indicator });
        },
        destroy() {
            close();
            menu.remove();
            grid.ownerDocument.removeEventListener('pointerdown', dismiss);
        },
    };
}
