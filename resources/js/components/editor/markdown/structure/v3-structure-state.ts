// Summary: Maintains a derived incremental V3 index and last valid source snapshot without changing raw editing/history; depends on the scanner, range index and CodeMirror transactions.
import { rememberV3StructureSnapshot } from './v3-structure-snapshots';
import { StateField, type ChangeSet, type Text } from '@codemirror/state';
import { hasInvalidV3Unicode, v3Contract } from './v3-contract';
import { V3DocumentIndex } from './v3-document-index';
import { parseV3Structure } from './v3-structure-parser';
import type { V3ParsedStructure } from './v3-structure-types';

export type V3StructureState = {
    source: Text;
    current: V3DocumentIndex;
    lastValid: { source: Text; index: V3DocumentIndex } | null;
    updateKind: 'parsed' | 'mapped-body';
};

const structuralLine = /^[ \t]*(?:\+\+|:{3,}|`{3,}|~{3,}|\$\$)/;
const utf8 = new TextEncoder();

export function mapV3OrdinaryBodyChanges(
    previous: V3DocumentIndex,
    update: { before: Text; after: Text; changes: ChangeSet },
): V3ParsedStructure | null {
    if (!previous.valid) return null;
    let safe = true;
    let sourceBytes = previous.structure.sourceBytes;
    update.changes.iterChanges((from, to, newFrom, newTo, inserted) => {
        const block = previous.blockAt(from);
        const before = update.before.lineAt(from);
        const after = update.after.lineAt(newFrom);
        const oldText = update.before.sliceString(from, to);
        const newText = inserted.toString();
        if (
            !block ||
            block.type === 'columns' ||
            from < block.bodyFrom ||
            to > block.bodyTo ||
            before.from < block.bodyFrom ||
            before.number !== update.before.lineAt(to).number ||
            after.number !== update.after.lineAt(newTo).number ||
            /[\n\r\0]/.test(oldText + newText) ||
            hasInvalidV3Unicode(after.text) ||
            structuralLine.test(before.text) ||
            structuralLine.test(after.text) ||
            utf8.encode(after.text).length > v3Contract.limits.lineBytes
        )
            safe = false;
        sourceBytes +=
            utf8.encode(newText).length - utf8.encode(oldText).length;
    });
    if (!safe || sourceBytes > v3Contract.limits.sourceBytes) return null;
    const map = (position: number, association: -1 | 1 = 1) =>
        update.changes.mapPos(position, association);
    const mapRange = <
        T extends {
            from: number;
            to: number;
            headerTo: number;
            bodyFrom: number;
            bodyTo: number;
        },
    >(
        range: T,
    ): T => ({
        ...range,
        from: map(range.from),
        to: map(range.to),
        headerTo: map(range.headerTo),
        bodyFrom: map(range.bodyFrom, -1),
        bodyTo: map(range.bodyTo),
    });
    return {
        ...previous.structure,
        sourceLength: update.after.length,
        sourceBytes,
        blocks: previous.structure.blocks.map(mapRange),
        columns: previous.structure.columns.map(mapRange),
        directives: previous.structure.directives.map(mapRange),
    };
}

export const v3StructureField = StateField.define<V3StructureState>({
    create(state) {
        const index = new V3DocumentIndex(parseV3Structure(state.doc));
        return {
            source: state.doc,
            current: rememberV3StructureSnapshot(state.doc, index),
            lastValid: index.valid ? { source: state.doc, index } : null,
            updateKind: 'parsed',
        };
    },
    update(previous, transaction) {
        if (!transaction.docChanged) return previous;
        const mapped = mapV3OrdinaryBodyChanges(previous.current, {
            before: transaction.startState.doc,
            after: transaction.newDoc,
            changes: transaction.changes,
        });
        const index = new V3DocumentIndex(
            mapped ?? parseV3Structure(transaction.newDoc),
        );
        return {
            source: transaction.newDoc,
            current: rememberV3StructureSnapshot(transaction.newDoc, index),
            //
            // A recovery snapshot retains its own source/coordinates; stale ranges cannot authorize a new edit.
            //
            lastValid: index.valid
                ? { source: transaction.newDoc, index }
                : previous.lastValid,
            updateKind: mapped ? 'mapped-body' : 'parsed',
        };
    },
});
