// Summary: Hides and protects editor-owned structure only in the Live Preview extension; depends on V3 ranges and validated owner annotations, leaving raw Source Mode unrestricted.
import {
    EditorSelection,
    EditorState,
    StateField,
    type Transaction,
} from '@codemirror/state';
import { Decoration, EditorView, type DecorationSet } from '@codemirror/view';
import {
    mapV3OrdinaryBodyChanges,
    v3StructureField,
} from '../structure/v3-structure-state';
import { parseV3Structure } from '../structure/v3-structure-parser';
import { v3OwnerOperation } from '../transactions/v3-transaction-types';
import { normalizeV3HeaderSelection } from './v3-live-selection';
import { changedV3BodyTypesAreValid } from './v3-body-validation';

export function v3ProtectedRanges(state: EditorState) {
    const index = state.field(v3StructureField).current;
    if (!index.valid) return [];
    const spans = index.structure.blocks.map((block) => ({
        from: block.from,
        to: block.type === 'spacer' ? block.bodyTo : block.bodyFrom,
    }));
    for (const directive of index.structure.directives) {
        spans.push({ from: directive.from, to: directive.bodyFrom });
        spans.push({ from: directive.bodyTo, to: directive.to });
    }
    spans.sort((left, right) => left.from - right.from || left.to - right.to);
    const merged: { from: number; to: number }[] = [];
    for (const span of spans) {
        const previous = merged.at(-1);
        if (previous && span.from <= previous.to)
            previous.to = Math.max(previous.to, span.to);
        else if (span.to > span.from) merged.push({ ...span });
    }
    return merged;
}

function permitsV3BodyTransaction(
    transaction: Transaction,
    protectedRanges: DecorationSet,
) {
    if (
        !transaction.docChanged ||
        transaction.annotation(v3OwnerOperation) ||
        transaction.isUserEvent('undo') ||
        transaction.isUserEvent('redo')
    )
        return true;
    const index = transaction.startState.field(v3StructureField).current;
    if (!index.valid) return false;
    let permitted = true;
    transaction.changes.iterChangedRanges((from, to) => {
        const block = index.blockAt(from);
        if (!block || from < block.bodyFrom || to > block.bodyTo)
            permitted = false;
        protectedRanges.between(from, to, (protectedFrom, protectedTo) => {
            if (
                from === to
                    ? from >= protectedFrom && from < protectedTo
                    : from < protectedTo && to > protectedFrom
            )
                permitted = false;
        });
    });
    if (!permitted) return false;
    const mapped = mapV3OrdinaryBodyChanges(index, {
        before: transaction.startState.doc,
        after: transaction.newDoc,
        changes: transaction.changes,
    });
    if (mapped) return changedV3BodyTypesAreValid(transaction, index, mapped);
    const next = parseV3Structure(transaction.newDoc);
    return (
        !next.diagnostics.length &&
        changedV3BodyTypesAreValid(transaction, index, next) &&
        next.blocks.length === index.structure.blocks.length &&
        next.columns.length === index.structure.columns.length &&
        next.blocks.every((block) => {
            const previous = index.blockById(block.id);
            return (
                previous &&
                previous.type === block.type &&
                previous.parentId === block.parentId
            );
        }) &&
        next.columns.every(
            (column) =>
                index.columnById(column.id)?.layoutId === column.layoutId,
        )
    );
}

export function v3LiveStructureExtensions(
    onRejected: () => void,
    renderColumnLayouts = false,
    renderRichBodies = false,
) {
    //
    // Cover the header's start so CodeMirror does not retain a phantom caret line before it; leave the body edge open so newly typed text stays visible.
    //
    const hiddenSyntax = Decoration.replace({
        block: true,
        inclusiveStart: true,
        inclusiveEnd: false,
    });
    const createStructureDecorations = (state: EditorState) =>
        Decoration.set(
            v3ProtectedRanges(state).map((span) =>
                hiddenSyntax.range(span.from, span.to),
            ),
        );
    const decorations = StateField.define({
        create: createStructureDecorations,
        update(previous, transaction) {
            if (!transaction.docChanged) return previous;
            return transaction.state.field(v3StructureField).updateKind ===
                'mapped-body'
                ? previous.map(transaction.changes)
                : createStructureDecorations(transaction.state);
        },
        provide: (field) => [
            EditorView.decorations.compute(
                [field, v3StructureField],
                (state) => {
                    const index = state.field(v3StructureField).current;
                    const layouts = renderColumnLayouts
                        ? index
                              .blocksIn(null)
                              .filter((block) => block.type === 'columns')
                        : [];
                    const covered = (from: number, to: number) =>
                        layouts.some(
                            (block) => from >= block.from && to <= block.to,
                        );
                    //
                    // Existing rich widgets/wrappers own their presentation fences; the V3 layer hides only identity headers on that surface while still protecting every delimiter.
                    //
                    if (renderRichBodies)
                        return Decoration.set(
                            index.valid
                                ? index.structure.blocks
                                      .filter(
                                          (block) =>
                                              block.type !== 'spacer' &&
                                              !covered(
                                                  block.from,
                                                  block.bodyFrom,
                                              ),
                                      )
                                      .map((block) =>
                                          hiddenSyntax.range(
                                              block.from,
                                              block.bodyFrom,
                                          ),
                                      )
                                : [],
                            true,
                        );
                    return state
                        .field(field)
                        .update({ filter: (from, to) => !covered(from, to) });
                },
            ),
            EditorView.atomicRanges.of((view) => view.state.field(field)),
        ],
    });
    return [
        decorations,
        EditorState.transactionFilter.of((transaction) => {
            if (
                !permitsV3BodyTransaction(
                    transaction,
                    transaction.startState.field(decorations),
                )
            ) {
                onRejected();
                return [];
            }
            if (transaction.docChanged || !transaction.selection)
                return transaction;
            const selection = EditorSelection.create(
                transaction.newSelection.ranges.map((range, i) =>
                    normalizeV3HeaderSelection(
                        transaction.startState,
                        range,
                        transaction.isUserEvent('select.pointer')
                            ? range.head
                            : (transaction.startState.selection.ranges[i]
                                  ?.head ?? range.head),
                    ),
                ),
                transaction.newSelection.mainIndex,
            );
            return selection.eq(transaction.newSelection)
                ? transaction
                : [transaction, { selection, sequential: true }];
        }),
    ];
}
