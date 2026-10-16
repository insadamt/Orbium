import type { Transaction } from '@codemirror/state';
import { richBlockMove } from './rich-widget-move';

function movedRichBlockPosition(transaction: Transaction, position: number) {
    const move = transaction.annotation(richBlockMove);
    return move && position >= move.from && position <= move.to
        ? move.destination + position - move.from
        : null;
}

export function mapRichContentPosition(
    transaction: Transaction,
    position: number,
    association: -1 | 1,
) {
    return (
        movedRichBlockPosition(transaction, position) ??
        transaction.changes.mapPos(position, association)
    );
}

export function mapRichBlockEdge(
    transaction: Transaction,
    position: number,
    edge: 'start' | 'end',
) {
    const moved = movedRichBlockPosition(transaction, position);
    if (moved !== null) return moved;
    const { changes } = transaction;
    let association = edge === 'start' ? 1 : -1;
    changes.iterChangedRanges((from, to) => {
        if (edge === 'start' && from <= position && to > position)
            association = -1;
        if (edge === 'end' && from < position && to >= position)
            association = 1;
    });
    return changes.mapPos(position, association);
}
