// Summary: Registers mounted V3 column projections for owner focus, IME and event delegation; depends on stable column IDs and the owner's derived index, not child persistence/history.
import type { EditorView } from '@codemirror/view';
import { v3StructureField } from '../../structure/v3-structure-state';

export type V3ColumnProjection = {
    owner: EditorView;
    view: EditorView;
    columnId: string;
    refresh: () => void;
    focus: (ownerPosition: number) => void;
    selectionBlockId: () => string | null;
};
const projections = new Set<V3ColumnProjection>();

export function registerV3ColumnProjection(projection: V3ColumnProjection) {
    projections.add(projection);
    return () => projections.delete(projection);
}

export function v3ColumnProjectionFor(view: EditorView) {
    return (
        [...projections].find((projection) => projection.view === view) ?? null
    );
}

export function isV3ColumnComposing(owner: EditorView, except?: EditorView) {
    return [...projections].some(
        (projection) =>
            projection.owner === owner &&
            projection.view !== except &&
            (projection.view.composing ||
                projection.view.compositionStarted ||
                projection.view.dom.querySelector(
                    '[data-mindmap-composing="true"]',
                )),
    );
}

export function resolveV3EmbeddedColumnBlock(
    owner: EditorView,
    target: EventTarget | null,
) {
    if (!(target instanceof Element)) return null;
    const projection = [...projections].find(
        (entry) => entry.owner === owner && entry.view.dom.contains(target),
    );
    if (!projection) return null;
    const column = owner.state
        .field(v3StructureField)
        .current.columnById(projection.columnId);
    const id = projection.selectionBlockId();
    return column &&
        id &&
        owner.state.field(v3StructureField).current.blockById(id)?.parentId ===
            column.id
        ? id
        : null;
}

export function focusV3OwnerColumnSelection(owner: EditorView) {
    const position = owner.state.selection.main.head;
    const index = owner.state.field(v3StructureField).current;
    const column = index.structure.columns.find(
        (entry) => position >= entry.bodyFrom && position < entry.bodyTo,
    );
    const projection =
        column &&
        [...projections].find(
            (entry) =>
                entry.owner === owner &&
                entry.columnId === column.id &&
                entry.view.dom.isConnected,
        );
    if (!projection) return false;
    projection.refresh();
    projection.focus(position);
    return true;
}

export function resolveV3ColumnPosition(owner: EditorView, position: number) {
    const index = owner.state.field(v3StructureField, false)?.current;
    const column = index?.structure.columns.find(
        (item) => position >= item.bodyFrom && position < item.bodyTo,
    );
    const projection =
        column &&
        [...projections].find(
            (item) => item.owner === owner && item.columnId === column.id,
        );
    return projection && column
        ? {
              view: projection.view,
              position: Math.min(
                  projection.view.state.doc.length,
                  position - column.bodyFrom,
              ),
          }
        : null;
}
