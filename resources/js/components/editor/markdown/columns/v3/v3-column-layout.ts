// Summary: Reuses existing column grid styling and divider behavior for V3 owner projections; depends on stable layout/column IDs, owner transactions and registered lifecycle refresh.
import { EditorView, ViewPlugin } from '@codemirror/view';
import type { Extension } from '@codemirror/state';
import { element } from '../../rich/widget-controls';
import { bindColumnDividers } from '../column-resize';
import { equalColumnWidths } from '../column-source';
import { v3StructureField } from '../../structure/v3-structure-state';
import { executeV3Operation } from '../../transactions/v3-transaction-dispatch';
import type { V3BlockOperation } from '../../transactions/v3-transaction-types';
import { readV3ColumnModel } from './v3-column-model';
import { mountV3ColumnProjection } from './v3-column-projection';
import { isV3ColumnComposing } from './v3-column-registry';

export type V3MountedLayout = {
    owner: EditorView;
    root: HTMLElement;
    layoutId: string;
    refresh: () => void;
    projections: () => ReturnType<typeof mountV3ColumnProjection>[];
    destroy: () => void;
};
const layouts = new Set<V3MountedLayout>();
export function mountedV3ColumnLayouts(owner: EditorView) {
    return [...layouts].filter(
        (layout) => layout.owner === owner && layout.root.isConnected,
    );
}
export const v3ColumnLayoutUpdates = ViewPlugin.define((view) => ({
    update() {
        for (const layout of mountedV3ColumnLayouts(view)) layout.refresh();
    },
}));

export function mountV3ColumnLayout(options: {
    owner: EditorView;
    root: HTMLElement;
    layoutId: string;
    clipboardScope: string;
    renderRichBodies?: boolean;
    isAvailable: () => boolean;
    onError: (error: Error) => void;
    extensionsForColumn?: (columnId: string) => Extension;
}) {
    let destroyed = false;
    let scheduled = false;
    let model = readV3ColumnModel(
        options.owner.state.field(v3StructureField).current,
        options.layoutId,
    );
    const projections = new Map<
        string,
        ReturnType<typeof mountV3ColumnProjection>
    >();
    const hosts = new Map<string, HTMLElement>();
    const grid = element('div', 'orbium-columns-grid');
    grid.dir = 'ltr';
    const notice = element(
        'p',
        'orbium-column-notice text-sm text-destructive',
    );
    notice.hidden = true;
    notice.setAttribute('role', 'status');
    const showError = (error: Error) => {
        notice.textContent = error.message;
        notice.hidden = false;
        options.onError(error);
    };
    const rootClassAlreadyPresent = options.root.classList.contains(
        'orbium-columns-block',
    );
    options.root.classList.add('orbium-columns-block');
    options.root.dataset.v3BlockId = options.layoutId;
    options.root.append(notice, grid);
    let resize: ReturnType<typeof bindColumnDividers> | null = null;
    let signature = '';
    function apply(operation: V3BlockOperation) {
        try {
            const result = executeV3Operation({
                view: options.owner,
                operation,
                isAvailable: options.isAvailable,
                preserveSelection: operation.kind === 'resize-columns',
                focusEditor: operation.kind !== 'resize-columns',
            });
            if (result.warning) showError(new Error(result.warning));
        } catch (error) {
            showError(
                error instanceof Error
                    ? error
                    : new Error('The column operation failed.'),
            );
        }
    }
    function rebuildGrid() {
        resize?.destroy();
        const currentIds = new Set(model.columns.map((column) => column.id));
        for (const [id, projection] of projections)
            if (!currentIds.has(id)) {
                projection.destroy();
                projections.delete(id);
                hosts.delete(id);
            }
        const children: HTMLElement[] = [];
        model.columns.forEach((column, index) => {
            if (index) {
                const divider = element('button', 'orbium-column-divider');
                divider.type = 'button';
                divider.setAttribute('role', 'separator');
                divider.setAttribute('aria-orientation', 'vertical');
                divider.setAttribute(
                    'aria-label',
                    `Resize columns ${index} and ${index + 1}`,
                );
                divider.title =
                    'Drag to resize · Arrow keys to adjust · Home to balance';
                children.push(divider);
            }
            let host = hosts.get(column.id);
            if (!host) {
                host = element('div', 'orbium-column');
                host.dir = 'auto';
                hosts.set(column.id, host);
            }
            host.dataset.columnIndex = String(index);
            host.dataset.v3ColumnId = column.id;
            children.push(host);
        });
        grid.replaceChildren(...children);
        model.columns.forEach((column, index) => {
            if (!projections.has(column.id))
                projections.set(
                    column.id,
                    mountV3ColumnProjection({
                        owner: options.owner,
                        host: hosts.get(column.id)!,
                        columnId: column.id,
                        index,
                        clipboardScope: options.clipboardScope,
                        renderRichBodies: options.renderRichBodies,
                        isAvailable: options.isAvailable,
                        onError: showError,
                        extensions: options.extensionsForColumn?.(column.id),
                    }),
                );
            else
                projections
                    .get(column.id)!
                    .view.contentDOM.setAttribute(
                        'aria-label',
                        `Column ${index + 1}`,
                    );
        });
        resize = bindColumnDividers({
            root: options.root,
            grid,
            owner: options.owner,
            widths: () => model.widths,
            composing: () =>
                !options.isAvailable() || isV3ColumnComposing(options.owner),
            commit: (widths) => {
                if (
                    widths.every(
                        (width, index) => width === model.widths[index],
                    )
                )
                    return;
                apply({
                    kind: 'resize-columns',
                    layoutId: options.layoutId,
                    widths,
                });
            },
        });
    }
    function synchronize() {
        scheduled = false;
        if (destroyed) return;
        const index = options.owner.state.field(v3StructureField).current;
        if (!index.blockById(options.layoutId)) return;
        model = readV3ColumnModel(index, options.layoutId);
        const nextSignature = model.columns
            .map((column) => column.id)
            .join(':');
        if (signature !== nextSignature) {
            signature = nextSignature;
            rebuildGrid();
            options.owner.requestMeasure();
        }
        options.root.dataset.richFrom = String(model.block.from);
        grid.dataset.columnCount = String(model.columns.length);
        grid.querySelectorAll<HTMLButtonElement>(
            '.orbium-column-divider',
        ).forEach((divider) => {
            divider.disabled =
                !options.isAvailable() ||
                options.owner.state.readOnly ||
                !options.owner.state.facet(EditorView.editable) ||
                isV3ColumnComposing(options.owner);
        });
        for (const projection of projections.values()) projection.refresh();
        if (!options.root.dataset.resizing) resize?.update();
    }
    function refresh() {
        if (!destroyed && !scheduled) {
            scheduled = true;
            queueMicrotask(synchronize);
        }
    }
    const focusFirst = () => {
        const first = options.owner.state
            .field(v3StructureField)
            .current.blocksIn(model.columns[0].id)[0];
        if (first) projections.get(model.columns[0].id)?.focus(first.bodyFrom);
    };
    const controller: V3MountedLayout = {
        owner: options.owner,
        root: options.root,
        layoutId: options.layoutId,
        refresh,
        projections: () =>
            model.columns
                .map((column) => projections.get(column.id)!)
                .filter(Boolean),
        destroy() {
            destroyed = true;
            layouts.delete(controller);
            options.root.removeEventListener('orbium-edit-rich', focusFirst);
            options.root.removeEventListener('compositionend', refresh, true);
            resize?.destroy();
            for (const projection of projections.values()) projection.destroy();
            projections.clear();
            hosts.clear();
            grid.remove();
            notice.remove();
            if (!rootClassAlreadyPresent)
                options.root.classList.remove('orbium-columns-block');
            delete options.root.dataset.v3BlockId;
        },
    };
    layouts.add(controller);
    options.root.addEventListener('orbium-edit-rich', focusFirst);
    options.root.addEventListener('compositionend', refresh, true);
    synchronize();
    return {
        ...controller,
        actions() {
            const disabled =
                !options.isAvailable() ||
                options.owner.state.readOnly ||
                !options.owner.state.facet(EditorView.editable) ||
                isV3ColumnComposing(options.owner);
            return [
                {
                    label: 'Add column',
                    disabled: disabled || model.columns.length >= 3,
                    run: () =>
                        apply({
                            kind: 'add-column',
                            layoutId: options.layoutId,
                        }),
                },
                {
                    label: 'Equal widths',
                    disabled,
                    run: () => {
                        const widths = equalColumnWidths(model.columns.length);
                        if (
                            !widths.every(
                                (width, index) => width === model.widths[index],
                            )
                        )
                            apply({
                                kind: 'resize-columns',
                                layoutId: options.layoutId,
                                widths,
                            });
                    },
                },
                {
                    label: 'Stack blocks',
                    disabled,
                    run: () =>
                        apply({
                            kind: 'stack-columns',
                            layoutId: options.layoutId,
                        }),
                },
            ];
        },
    };
}
