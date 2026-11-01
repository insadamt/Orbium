// Summary: Translates a projected column's bounded native text changes into exact owner body edits; depends on a source snapshot and stable child IDs, never an independent child history or whole-layout serialization.
import { ChangeSet } from '@codemirror/state';
import {
    createV3OperationDraft,
    V3OperationError,
    type V3BlockOperation,
    type V3OperationContext,
} from '../../transactions/v3-transaction-types';

export function planV3ColumnEdit(
    context: V3OperationContext,
    operation: V3BlockOperation,
) {
    if (operation.kind !== 'edit-column') return null;
    const column = context.index.columnById(operation.columnId);
    if (!column || context.state.doc !== operation.ownerSource)
        throw new V3OperationError(
            'stale-column-edit',
            'The column changed in its owner. Refresh it before editing.',
        );
    const draft = createV3OperationDraft();
    //
    // The final LF frames the parent's closing directive; a projected editor must never delete that separator as ordinary text.
    //
    const sourceLength =
        column.bodyTo -
        column.bodyFrom -
        (column.bodyTo > column.bodyFrom &&
        context.state.sliceDoc(column.bodyTo - 1, column.bodyTo) === '\n'
            ? 1
            : 0);
    for (const edit of operation.edits) {
        if (
            !Number.isInteger(edit.from) ||
            !Number.isInteger(edit.to) ||
            edit.from < 0 ||
            edit.to < edit.from ||
            edit.to > sourceLength ||
            typeof edit.insert !== 'string'
        )
            throw new V3OperationError(
                'invalid-column-edit',
                'The column edit is outside its source snapshot.',
            );
        const from = column.bodyFrom + edit.from;
        const to = column.bodyFrom + edit.to;
        let block = context.index.blockAt(from);
        if (from === column.bodyTo && from === to)
            block = context.index.blocksIn(column.id).at(-1) ?? null;
        if (
            !block ||
            block.parentId !== column.id ||
            from < block.bodyFrom ||
            to > block.bodyTo
        )
            throw new V3OperationError(
                'protected-column-structure',
                'Column typing cannot cross a child header or delimiter.',
            );
        const protectedDirective = context.index.structure.directives.some(
            (directive) =>
                directive.blockId === block.id &&
                [
                    { from: directive.from, to: directive.bodyFrom },
                    { from: directive.bodyTo, to: directive.to },
                ].some((span) =>
                    from === to
                        ? from >= span.from && from < span.to
                        : from < span.to && to > span.from,
                ),
        );
        if (protectedDirective)
            throw new V3OperationError(
                'protected-column-structure',
                'Column typing cannot edit presentation or container delimiters.',
            );
        draft.changes.push({ from, to, insert: edit.insert });
        draft.affectedIds.add(block.id);
    }
    const localChanges = ChangeSet.of([...operation.edits], sourceLength);
    for (const position of [
        operation.selection.anchor,
        operation.selection.head,
    ])
        if (
            !Number.isInteger(position) ||
            position < 0 ||
            position > localChanges.newLength
        )
            throw new V3OperationError(
                'invalid-column-selection',
                'The caret must remain in the edited column.',
            );
    draft.affectedIds.add(column.layoutId);
    draft.columnSelection = { columnId: column.id, ...operation.selection };
    draft.afterIds = [...draft.affectedIds].filter(
        (id) => id !== column.layoutId,
    );
    return draft;
}
