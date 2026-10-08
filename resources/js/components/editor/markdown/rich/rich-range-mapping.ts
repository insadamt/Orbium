import type { ChangeDesc } from '@codemirror/state';

export function mapRichBlockEdge(
    changes: ChangeDesc,
    position: number,
    edge: 'start' | 'end',
) {
    let association = edge === 'start' ? 1 : -1;
    changes.iterChangedRanges((from, to) => {
        if (edge === 'start' && from <= position && to > position)
            association = -1;
        if (edge === 'end' && from < position && to >= position)
            association = 1;
    });
    return changes.mapPos(position, association);
}
