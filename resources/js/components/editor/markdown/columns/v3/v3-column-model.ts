// Summary: Reads identified column layouts directly from the owner index and serializes new layouts safely; depends on V3 source ranges and existing normalized width rules, preserving child payload bytes.
import type { EditorState, Text } from '@codemirror/state';
import type { V3DocumentIndex } from '../../structure/v3-document-index';
import type {
    V3Block,
    V3Column,
    V3Directive,
} from '../../structure/v3-structure-types';
import { V3OperationError } from '../../transactions/v3-transaction-types';
import { completeV3BlockSource } from '../../transactions/v3-source-edits';

export type V3ColumnModel = {
    block: V3Block;
    directive: V3Directive;
    columns: V3Column[];
    widths: number[];
};

export function v3DirectiveFenceSpan(source: Text, position: number) {
    const line = source.lineAt(position);
    const match = /^ {0,3}(:{3,})/.exec(line.text);
    if (!match)
        throw new V3OperationError(
            'missing-container-fence',
            'The container delimiter is no longer available.',
        );
    const from = line.from + match[0].length - match[1].length;
    return { from, to: from + match[1].length };
}

export function readV3ColumnModel(
    index: V3DocumentIndex,
    layoutId: string,
): V3ColumnModel {
    const block = index.blockById(layoutId);
    const directive = index.structure.directives.find(
        (entry) =>
            entry.blockId === layoutId && entry.metadata.kind === 'columns',
    );
    if (!block || block.type !== 'columns' || !directive || !index.valid)
        throw new V3OperationError(
            'missing-layout',
            'This identified layout is unavailable in the owning document.',
        );
    const columns = index.structure.columns.filter(
        (column) => column.layoutId === layoutId,
    );
    return {
        block,
        directive,
        columns,
        widths: [...(directive.metadata.widths as number[])],
    };
}

export function requireV3Widths(widths: readonly number[], count: number) {
    if (
        ![2, 3].includes(count) ||
        widths.length !== count ||
        widths.some((width) => !Number.isInteger(width) || width < 1500) ||
        widths.reduce((sum, width) => sum + width, 0) !== 10000
    )
        throw new V3OperationError(
            'invalid-column-widths',
            'Use two or three integer widths of at least 1500, totaling 10000.',
        );
}

export function serializeV3Columns(request: {
    id: string;
    columns: readonly { id: string; source: string }[];
    widths: readonly number[];
}) {
    requireV3Widths(request.widths, request.columns.length);
    let columnFenceLength = 4;
    for (const column of request.columns)
        for (const line of column.source.split('\n'))
            columnFenceLength = Math.max(
                columnFenceLength,
                (/^\s*(:{3,})/.exec(line)?.[1].length ?? 0) + 1,
            );
    const columnFence = ':'.repeat(columnFenceLength);
    const layoutFence = `${columnFence}:`;
    const body = request.columns
        .map(
            (column) =>
                `${columnFence}orbium ${JSON.stringify({ kind: 'column', id: column.id })}\n${column.source}${column.source.endsWith('\n') ? '' : '\n'}${columnFence}\n`,
        )
        .join('\n');
    return completeV3BlockSource(
        { id: request.id, type: 'columns' },
        `${layoutFence}orbium ${JSON.stringify({ kind: 'columns', version: 1, widths: request.widths })}\n${body}${layoutFence}\n`,
    );
}

export function sourceV3ColumnChildren(
    state: Pick<EditorState, 'sliceDoc'>,
    index: V3DocumentIndex,
    columnId: string,
) {
    return index
        .blocksIn(columnId)
        .map((block) => state.sliceDoc(block.from, block.to))
        .join('');
}
