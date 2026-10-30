// Summary: Associates mounted column editors with their owning Document so drag/drop and IME checks use one canonical history; depends on CodeMirror and column layout models.
import type { EditorView } from '@codemirror/view';
import type { RichBlock } from '../rich/rich-model';
import type { ColumnLayout } from './column-source';

export type MountedColumns = {
    owner: EditorView;
    root: HTMLElement;
    current: () => { block: RichBlock; layout: ColumnLayout };
    editors: () => EditorView[];
    composing: () => boolean;
    refreshSearch: () => void;
    focus: (index: number, position?: number) => void;
};
const mounted = new Set<MountedColumns>();
const columnOwners = new WeakMap<
    EditorView,
    { columns: MountedColumns; index: number }
>();

export function registerMountedColumns(columns: MountedColumns) {
    mounted.add(columns);
    return () => mounted.delete(columns);
}

export function registerColumnEditor(
    view: EditorView,
    columns: MountedColumns,
    index: number,
) {
    columnOwners.set(view, { columns, index });
    return () => columnOwners.delete(view);
}

export function columnEditorOwner(view: EditorView) {
    return columnOwners.get(view);
}

export function mountedDocumentColumns(owner: EditorView) {
    return [...mounted].filter(
        (columns) => columns.owner === owner && columns.root.isConnected,
    );
}

export function isColumnEditorComposing(root?: HTMLElement) {
    return [...mounted].some(
        (columns) => root?.contains(columns.root) && columns.composing(),
    );
}
