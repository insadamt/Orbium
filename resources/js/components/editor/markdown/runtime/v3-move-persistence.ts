// Summary: Delays destructive cross-document saves until the receiving document confirms persistence, including linked undo/redo; depends on native V3 block IDs and successful revision-checked saves.
import type { Text } from '@codemirror/state';
import { requireValidV3Structure } from '../structure/v3-document-file';

type DocumentIdentity = { workspaceId: number; nodeId: number };
type SaveBarrier = {
    id: string;
    removing: DocumentIdentity;
    receiving: DocumentIdentity;
    blockIds: readonly string[];
    expectedBodies: Map<string, string | null>;
};
type PersistenceHost = Window & {
    orbiumV3MoveSaveBarriers?: Map<string, SaveBarrier>;
};
export const v3MoveSavedEvent = 'orbium:v3-move-saved';

export function v3PersistenceHost() {
    return (window.top ?? window) as PersistenceHost;
}

function ensureMoveSaveBarriers(): Map<string, SaveBarrier> {
    return (v3PersistenceHost().orbiumV3MoveSaveBarriers ??= new Map<
        string,
        SaveBarrier
    >());
}

function pendingMoveSaveBarriers() {
    return v3PersistenceHost().orbiumV3MoveSaveBarriers;
}

export function isV3BlockMovePending(blockId: string) {
    return [...(pendingMoveSaveBarriers()?.values() ?? [])].some((barrier) =>
        barrier.blockIds.includes(blockId),
    );
}

function sameDocument(left: DocumentIdentity, right: DocumentIdentity) {
    return (
        left.workspaceId === right.workspaceId && left.nodeId === right.nodeId
    );
}

function sourceBlockIds(source: Text) {
    return new Set(
        requireValidV3Structure(source.toString()).structure.blocks.map(
            (block) => block.id,
        ),
    );
}

export function updateV3MoveReceivingSnapshot(
    document: DocumentIdentity,
    source: Text,
) {
    const relevant = [...(pendingMoveSaveBarriers()?.values() ?? [])].filter(
        (barrier) => sameDocument(barrier.receiving, document),
    );
    if (!relevant.length) return;
    try {
        const index = requireValidV3Structure(source.toString());
        for (const barrier of relevant)
            for (const id of barrier.blockIds) {
                const block = index.blockById(id);
                barrier.expectedBodies.set(
                    id,
                    block
                        ? `${block.type}:${source.sliceString(block.bodyFrom, block.bodyTo)}`
                        : null,
                );
            }
    } catch {
        //
        // Invalid Source edits are reported by the normal save validator and cannot release a move barrier.
        //
        for (const barrier of relevant)
            for (const id of barrier.blockIds)
                barrier.expectedBodies.set(id, null);
    }
}

export function protectV3MoveSave(barrier: SaveBarrier) {
    const pendingBarriers = ensureMoveSaveBarriers();
    for (const pending of pendingBarriers.values())
        if (
            pending.id !== barrier.id &&
            [pending.removing, pending.receiving].some(
                (document) =>
                    sameDocument(document, barrier.removing) ||
                    sameDocument(document, barrier.receiving),
            )
        )
            throw new Error(
                'Wait for the pending block move to save before moving more blocks through these documents.',
            );
    //
    // Reversing a pending move replaces its dependency, so undo cannot deadlock the two save queues.
    //
    pendingBarriers.set(barrier.id, barrier);
    return () => {
        if (pendingBarriers.get(barrier.id) === barrier)
            pendingBarriers.delete(barrier.id);
    };
}

export function v3MoveSaveMustWait(document: DocumentIdentity, source: Text) {
    const relevant = [...(pendingMoveSaveBarriers()?.values() ?? [])].filter(
        (barrier) => sameDocument(barrier.removing, document),
    );
    if (!relevant.length) return false;
    try {
        const ids = sourceBlockIds(source);
        return relevant.some((barrier) =>
            barrier.blockIds.some((id) => !ids.has(id)),
        );
    } catch {
        return false;
    }
}

export function acknowledgeV3MoveSave(
    document: DocumentIdentity,
    source: Text,
) {
    const relevant = [...(pendingMoveSaveBarriers()?.values() ?? [])].filter(
        (barrier) => sameDocument(barrier.receiving, document),
    );
    if (!relevant.length) return;
    const index = requireValidV3Structure(source.toString());
    let released = false;
    for (const barrier of relevant)
        if (
            barrier.blockIds.every((id) => {
                const block = index.blockById(id);
                return (
                    block &&
                    barrier.expectedBodies.get(id) ===
                        `${block.type}:${source.sliceString(block.bodyFrom, block.bodyTo)}`
                );
            })
        ) {
            pendingMoveSaveBarriers()?.delete(barrier.id);
            released = true;
        }
    if (released)
        v3PersistenceHost().dispatchEvent(new Event(v3MoveSavedEvent));
}
