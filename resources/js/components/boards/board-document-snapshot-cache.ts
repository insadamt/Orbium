import type { ResourceDocument } from './board-resource-types';

const maximumCachedBytes = 8 * 1024 * 1024;
const maximumCachedDocuments = 24;

export class BoardDocumentSnapshotCache {
    private entries = new Map<
        number,
        { snapshot: ResourceDocument; bytes: number }
    >();
    private bytes = 0;

    read(targetId: number, revision: number | null) {
        const entry = this.entries.get(targetId);
        if (!entry || entry.snapshot.revision !== revision) return null;
        this.entries.delete(targetId);
        this.entries.set(targetId, entry);
        return entry.snapshot;
    }

    remember(snapshot: ResourceDocument) {
        this.invalidate(snapshot.id);
        const bytes = JSON.stringify(snapshot).length * 2;
        if (bytes > maximumCachedBytes) return;
        this.entries.set(snapshot.id, { snapshot, bytes });
        this.bytes += bytes;
        //
        // Reusing source after culling must not turn a long Board session into an unbounded Document cache.
        //
        while (
            this.entries.size > maximumCachedDocuments ||
            this.bytes > maximumCachedBytes
        ) {
            const oldest = this.entries.keys().next().value;
            if (oldest === undefined) break;
            this.invalidate(oldest);
        }
    }

    invalidate(targetId: number) {
        const entry = this.entries.get(targetId);
        if (!entry) return;
        this.entries.delete(targetId);
        this.bytes -= entry.bytes;
    }
}
