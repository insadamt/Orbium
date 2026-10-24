import type { BoardRecordStore } from '../board-record-store';
import type { BoardPreparedPreviews } from '../board-prepared-previews';
import type { BoardWorkScheduler } from '../board-work-scheduler';
import type { BoardObject } from '../board-types';
import { BoardPdfSceneStore } from './board-pdf-scene-store';
import { instantSceneBudgets } from './board-renderer-mode';
import {
    BoardSceneAssets,
    type PreparedBoardVisual,
} from './board-scene-assets';
import {
    prepareBoardText,
    supportsPreparedBoardText,
} from './prepare-board-text';

export class BoardInstantScene {
    readonly pdfs: BoardPdfSceneStore;
    private assets = new BoardSceneAssets();
    private pending = new Set<string>();
    private presented = new Set<string>();
    private listeners = new Map<string, Set<() => void>>();
    private versions = new Map<string, number>();
    private cancelJob: (() => void) | undefined;
    private editingId: string | null = null;
    private connected = false;
    private generation = 0;
    private running = false;
    private startedAt = performance.now();
    private preparationFinishedMs: number | null = null;
    private counters = {
        hits: 0,
        misses: 0,
        preparedText: 0,
        diagramInitializations: 0,
        presentationAttachments: 0,
        preparationMs: 0,
    };

    constructor(
        private options: {
            store: BoardRecordStore;
            scheduler: BoardWorkScheduler;
            prepared: BoardPreparedPreviews;
            boardId: number;
        },
    ) {
        this.pdfs = new BoardPdfSceneStore(options.store, options.scheduler);
    }

    private get store() {
        return this.options.store;
    }

    supports(object: BoardObject) {
        return (
            supportsPreparedBoardText(object) || object.block_type === 'mermaid'
        );
    }

    connect() {
        this.connected = true;
        const update = (ids: Iterable<string>) => {
            for (const id of ids) {
                this.pdfs.reconcile([id]);
                const object = this.store.getObject(id);
                if (!object || !this.supports(object)) {
                    this.pending.delete(id);
                    this.assets.remove(id);
                    this.notify(id);
                } else if (
                    !this.assets.reuseVisual(object) &&
                    id !== this.editingId
                ) {
                    this.pending.add(id);
                }
            }
            this.schedulePreparation();
        };
        const unsubscribe = this.store.subscribeChanges(update);
        update(this.store.getObjects().map((object) => object.id));
        return () => {
            this.connected = false;
            this.generation++;
            unsubscribe();
            this.cancelJob?.();
            this.cancelJob = undefined;
            this.running = false;
            this.pending.clear();
            this.presented.clear();
            this.assets.clear();
            this.pdfs.clear();
        };
    }

    updatePresentation(ids: string[], editingId: string | null) {
        const previousEditing = this.editingId;
        if (editingId !== previousEditing)
            this.pdfs.releaseForOtherEditor(editingId);
        this.editingId = editingId;
        this.presented = new Set(ids);
        if (editingId) this.pending.delete(editingId);
        if (previousEditing && previousEditing !== editingId)
            this.request(previousEditing);
        for (const id of ids) this.request(id);
    }

    reuseVisual(object: BoardObject) {
        return this.assets.reuseVisual(object);
    }

    needsNativeFallback(object: BoardObject) {
        return this.assets.needsNativeFallback(object);
    }

    prepareVisualForPresentation(object: BoardObject) {
        this.counters.presentationAttachments++;
        const ready = this.reuseVisual(object);
        if (ready) {
            this.counters.hits++;
            return ready;
        }
        this.counters.misses++;
        //
        // Cold native text is safe to prepare before paint; only expensive diagrams wait for the bounded render lane.
        //
        if (supportsPreparedBoardText(object))
            return this.prepareText(object, false);
        const { prepared, boardId } = this.options;
        const diagram = prepared.reuseDiagram(
            'board',
            boardId,
            object.data.source ?? '',
        );
        if (diagram) {
            const visual = { kind: 'diagram', preview: diagram } as const;
            this.assets.remember(object, visual);
            return visual;
        }
        this.request(object.id);
    }

    subscribe(id: string, listener: () => void) {
        let listeners = this.listeners.get(id);
        if (!listeners) this.listeners.set(id, (listeners = new Set()));
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
            if (!listeners.size) this.listeners.delete(id);
            if (!this.store.getObject(id)) this.versions.delete(id);
        };
    }

    version(id: string) {
        return this.versions.get(id) ?? 0;
    }

    snapshot() {
        return {
            ...this.counters,
            ...this.assets.snapshot(),
            pending: this.pending.size,
            activePreparations: Number(this.running),
            preparationFinishedMs: this.preparationFinishedMs,
            backgroundSuspended: document.hidden,
            budgets: instantSceneBudgets,
            pdfs: this.pdfs.snapshot(),
        };
    }

    private request(id: string) {
        const object = this.store.getObject(id);
        if (
            !object ||
            id === this.editingId ||
            !this.supports(object) ||
            this.assets.reuseVisual(object)
        )
            return;
        this.pending.add(id);
        this.schedulePreparation();
    }

    private schedulePreparation() {
        if (
            !this.connected ||
            this.cancelJob ||
            this.running ||
            !this.pending.size
        )
            return;
        const generation = this.generation;
        this.cancelJob = this.options.scheduler.enqueue(
            'render',
            async () => {
                this.cancelJob = undefined;
                this.running = true;
                const batchStarted = performance.now();
                try {
                    for (
                        let count = 0;
                        count < instantSceneBudgets.preparationBatchObjects;
                        count++
                    ) {
                        if (generation !== this.generation || document.hidden)
                            break;
                        const id = this.chooseNextId();
                        if (!id) break;
                        this.pending.delete(id);
                        const object = this.store.getObject(id);
                        if (
                            !object ||
                            id === this.editingId ||
                            this.assets.reuseVisual(object)
                        )
                            continue;
                        if (supportsPreparedBoardText(object))
                            this.prepareText(object);
                        else await this.prepareDiagram(object, generation);
                        if (
                            performance.now() - batchStarted >=
                            instantSceneBudgets.preparationBatchMs
                        )
                            break;
                    }
                } finally {
                    if (generation === this.generation) {
                        this.running = false;
                        if (
                            !this.pending.size &&
                            this.preparationFinishedMs === null
                        )
                            this.preparationFinishedMs =
                                performance.now() - this.startedAt;
                        this.schedulePreparation();
                    }
                }
            },
            () => (this.hasPresentedPending() ? 0 : 2),
        );
    }

    private chooseNextId() {
        for (const id of this.presented) if (this.pending.has(id)) return id;
        return this.pending.values().next().value;
    }

    private hasPresentedPending() {
        for (const id of this.presented) if (this.pending.has(id)) return true;
        return false;
    }

    private prepareText(
        object: BoardObject,
        notify = true,
    ): PreparedBoardVisual {
        const start = performance.now();
        const visual = {
            kind: 'text',
            template: prepareBoardText(object),
        } as const;
        this.assets.remember(object, visual);
        this.pending.delete(object.id);
        this.counters.preparedText++;
        this.counters.preparationMs += performance.now() - start;
        if (notify) this.notify(object.id);
        return visual;
    }

    private async prepareDiagram(object: BoardObject, generation: number) {
        const start = performance.now();
        const current = () =>
            this.connected &&
            generation === this.generation &&
            this.store.getObject(object.id)?.data === object.data;
        try {
            const { prepared, boardId } = this.options;
            const source = object.data.source ?? '';
            const cached = prepared.reuseDiagram('board', boardId, source);
            if (!cached) this.counters.diagramInitializations++;
            const preview =
                cached ??
                (await prepared.renderNativeDiagram(
                    boardId,
                    source,
                    () => current() && !document.hidden,
                ));
            if (!preview) {
                if (current()) this.pending.add(object.id);
                return;
            }
            if (current())
                this.assets.remember(object, {
                    kind: 'diagram',
                    preview,
                });
        } catch {
            if (current())
                this.assets.remember(object, {
                    kind: 'error',
                    message:
                        'Diagram could not be rendered. Edit the source to fix it.',
                });
        } finally {
            if (current()) {
                this.counters.preparationMs += performance.now() - start;
                this.notify(object.id);
            }
        }
    }

    private notify(id: string) {
        if (!this.store.getObject(id) && !this.listeners.has(id)) {
            this.versions.delete(id);
            return;
        }
        this.versions.set(id, this.version(id) + 1);
        this.listeners.get(id)?.forEach((listener) => listener());
    }
}
