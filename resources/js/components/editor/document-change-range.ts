import type { Node as ProseMirrorNode } from '@tiptap/pm/model';

export type DocumentRange = { from: number; to: number };

function enclosingBlocks(
    document: ProseMirrorNode,
    from: number,
    to: number,
): DocumentRange {
    const start = document.resolve(from);
    const end = document.resolve(Math.max(from, to));
    return {
        from: start.depth > 0 ? start.before(1) : start.pos,
        to: end.depth > 0 ? end.after(1) : end.pos,
    };
}

export function findChangedBlockRanges(
    previous: ProseMirrorNode,
    current: ProseMirrorNode,
): { previous: DocumentRange; current: DocumentRange } | null {
    const start = previous.content.findDiffStart(current.content);
    if (start === null) return null;
    const end = previous.content.findDiffEnd(current.content);
    return {
        previous: enclosingBlocks(previous, start, end?.a ?? start),
        current: enclosingBlocks(current, start, end?.b ?? start),
    };
}

export function findTransactionBlockRanges(
    transaction: import('@tiptap/pm/state').Transaction,
): { previous: DocumentRange; current: DocumentRange } | null {
    const difference = findChangedBlockRanges(
        transaction.before,
        transaction.doc,
    );
    let previousFrom = difference?.previous.from ?? Infinity;
    let previousTo = difference?.previous.to ?? 0;
    let currentFrom = difference?.current.from ?? Infinity;
    let currentTo = difference?.current.to ?? 0;
    // Equal duplicate blocks can hide an insertion from a content diff; step maps retain its actual location.
    transaction.mapping.maps.forEach((map, index) => {
        const before = transaction.mapping.slice(0, index).invert();
        const after = transaction.mapping.slice(index + 1);
        map.forEach((oldStart, oldEnd, newStart, newEnd) => {
            previousFrom = Math.min(previousFrom, before.map(oldStart, -1));
            previousTo = Math.max(previousTo, before.map(oldEnd, 1));
            currentFrom = Math.min(currentFrom, after.map(newStart, -1));
            currentTo = Math.max(currentTo, after.map(newEnd, 1));
        });
    });
    if (!Number.isFinite(previousFrom)) return null;
    return {
        previous: enclosingBlocks(transaction.before, previousFrom, previousTo),
        current: enclosingBlocks(transaction.doc, currentFrom, currentTo),
    };
}
