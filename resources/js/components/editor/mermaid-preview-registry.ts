import type { MermaidPreviewEntry } from './mermaid-preview-entry';

export class MermaidPreviewRegistry extends Map<string, MermaidPreviewEntry> {
    private preparedListeners = new Set<() => void>();

    prepareSource(source: string): MermaidPreviewEntry {
        const existing = this.get(source);
        if (existing) return existing;
        const entry: MermaidPreviewEntry = {
            source,
            subscribers: new Map(),
            displayed: new Set(),
            sanitized: false,
            queuedAt: performance.now(),
            state: 'pending',
            persisted: false,
            persistPending: false,
            attemptedSave: -1,
        };
        this.set(source, entry);
        return entry;
    }

    releaseUnusedSources(sources: Set<string>) {
        for (const [source, entry] of this)
            if (!sources.has(source) && entry.subscribers.size === 0)
                this.delete(source);
    }

    subscribePrepared(listener: () => void) {
        this.preparedListeners.add(listener);
        return () => {
            this.preparedListeners.delete(listener);
        };
    }

    notifyPrepared() {
        for (const listener of this.preparedListeners) listener();
    }

    override clear() {
        super.clear();
        this.preparedListeners.clear();
    }
}
