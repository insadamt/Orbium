import type {
    MermaidPreviewEntry as Entry,
    MermaidSubscriber as Subscriber,
} from './mermaid-preview-entry';
import {
    mountNextMermaidPreview,
    showMermaidRenderError,
} from './mermaid-preview-display';
import { readMermaidPreviewDimensions } from './mermaid-preview-layout';
import { rankMermaidPreparationEntries } from './mermaid-preparation-priority';
import { MermaidSessionViewport } from './mermaid-session-viewport';
import { scheduleEditorIdleWork } from './schedule-editor-idle-work';
import {
    fetchSavedMermaidPreview,
    persistMermaidPreview,
} from './mermaid-cache-api';
import {
    mermaidPreparationDelay,
    scheduleMermaidPreparation,
} from './mermaid-preparation-scheduling';
import {
    sanitizeMermaidPreview,
    renderMermaidPreview,
    type CachedPreview,
} from './mermaid-preview-renderer';
import {
    adjustEditorPerformanceCounter,
    markEditorPerformance,
    measureEditorAsync,
    recordEditorDuration,
} from '@/lib/editor-performance';

export class MermaidPreviewSession {
    private entries = new Map<string, Entry>();
    private elementEntries = new Map<HTMLElement, Entry>();
    private viewport = new MermaidSessionViewport({
        elements: () => this.registeredElements(),
        interaction: (event) => this.onInteraction(event),
        changed: () => this.onViewportChange(),
        nearby: (element) => this.markNearbyPreview(element),
    });
    private cancelResume?: () => void;
    private active = true;
    private controller = new AbortController();
    private cancelPreparation?: () => void;
    private scheduledPriority = Infinity;
    private viewportTimer?: number;
    private rescheduleFrame?: number;
    private rendering = false;
    private preparingCache = false;
    private lookups = 0;
    private persisting = 0;
    private started = false;
    private destroyed = false;
    private direction = 1;
    private previousScroll = 0;
    private lastInteraction = 0;
    private lastScroll = 0;
    private lastRenderFinished = 0;
    private composing = false;
    private manipulating = false;
    private saveGeneration = 0;
    private firstReady = false;

    constructor(
        private workspaceId: number,
        private nodeId: number,
    ) {}

    register(source: string, element: HTMLElement, subscriber: Subscriber) {
        let entry = this.entries.get(source);
        if (!entry) {
            entry = {
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
            this.entries.set(source, entry);
        }
        entry.subscribers.set(element, subscriber);
        this.elementEntries.set(element, entry);
        if (entry.dimensions) subscriber({ dimensions: entry.dimensions });
        this.viewport.observe(element);
        if (entry.state === 'ready') {
            entry.state = 'display';
            entry.queuedAt = performance.now();
        }
        if (entry.state === 'error') subscriber({ error: entry.error });
        this.schedule();
        return () => {
            entry.subscribers.delete(element);
            this.elementEntries.delete(element);
            entry.displayed.delete(element);
            this.viewport.unobserve(element);

            if (entry.subscribers.size === 0 && entry.state !== 'lookup')
                this.entries.delete(source);
        };
    }

    start(editorDom: HTMLElement) {
        if (this.started || this.destroyed) return;
        this.started = true;
        this.viewport.start(editorDom);
        if (this.active) this.resume();
    }

    setActive(active: boolean) {
        if (this.active === active || this.destroyed) return;
        this.active = active;
        adjustEditorPerformanceCounter(
            active ? 'mermaid.resumes' : 'mermaid.pauses',
            1,
        );
        this.cancelScheduledJob();
        this.cancelResume?.();
        this.cancelResume = undefined;
        if (this.viewportTimer !== undefined) clearTimeout(this.viewportTimer);
        if (this.rescheduleFrame !== undefined)
            cancelAnimationFrame(this.rescheduleFrame);
        this.viewportTimer = this.rescheduleFrame = undefined;
        this.viewport.pause();
        this.composing = this.manipulating = false;
        if (active && this.started) this.resume();
    }

    private resume() {
        this.cancelResume = scheduleEditorIdleWork(() => {
            this.cancelResume = undefined;
            if (!this.active || this.destroyed) return;
            this.previousScroll = this.scrollPosition();
            this.viewport.resume();
            this.schedule();
            if (!this.viewport.observed)
                for (const element of this.registeredElements())
                    this.markNearbyPreview(element);
            for (const entry of this.entries.values()) this.persist(entry);
        });
    }

    refresh() {
        this.cancelScheduledJob();
        this.schedule();
    }

    notifySaved() {
        this.saveGeneration += 1;
        for (const entry of this.entries.values()) this.persist(entry);
    }

    private scrollPosition() {
        return this.viewport.scrollContainer?.scrollTop ?? window.scrollY;
    }

    private onInteraction = (event: Event) => {
        if (!this.active || this.destroyed) return;
        if (event.type === 'wheel') {
            this.onViewportChange();
            return;
        }
        if (event.type === 'pointermove' && !this.manipulating) return;
        if (event.type === 'compositionstart') this.composing = true;
        if (event.type === 'compositionend') this.composing = false;
        if (event.type === 'pointerdown' || event.type === 'dragstart')
            this.manipulating = true;
        if (['pointerup', 'pointercancel', 'dragend'].includes(event.type))
            this.manipulating = false;
        this.lastInteraction = performance.now();
        this.cancelScheduledJob();
        this.schedule();
    };

    private onViewportChange = () => {
        if (!this.active || this.destroyed) return;
        const position = this.scrollPosition();
        if (position !== this.previousScroll)
            this.direction = position > this.previousScroll ? 1 : -1;
        this.previousScroll = position;
        this.lastScroll = performance.now();
        if (this.viewportTimer === undefined) {
            this.viewportTimer = window.setTimeout(() => {
                this.viewportTimer = undefined;
                this.schedule();
            }, 80);
        }
    };

    private *registeredElements() {
        for (const entry of this.entries.values())
            yield* entry.subscribers.keys();
    }

    private markNearbyPreview(element: HTMLElement) {
        const entry = this.elementEntries.get(element);
        if (!entry || entry.displayed.has(element)) return;
        if (entry.state === 'error') {
            entry.subscribers.get(element)?.({ error: entry.error });
            entry.displayed.add(element);
        } else if (entry.state === 'ready') {
            entry.state = 'display';
            entry.queuedAt = performance.now();
        }
    }

    private rankedEntries() {
        return rankMermaidPreparationEntries({
            entries: this.entries.values(),
            near: this.viewport.near,
            observed: this.viewport.observed,
            scrollContainer: this.viewport.scrollContainer,
            direction: this.direction,
        });
    }

    private cancelScheduledJob() {
        this.cancelPreparation?.();
        this.cancelPreparation = undefined;
    }

    private nextEntry() {
        return this.rankedEntries().find(({ entry }) => {
            if (entry.state === 'pending') return this.lookups < 4;
            if (entry.state === 'cached') return !this.preparingCache;
            return entry.state !== 'render' || !this.rendering;
        });
    }

    private preparationTiming(next: { entry: Entry; rank: number }) {
        return {
            ...next,
            lastInteraction: this.lastInteraction,
            lastScroll: this.lastScroll,
            lastRenderFinished: this.lastRenderFinished,
        };
    }

    private schedule() {
        if (
            !this.active ||
            !this.started ||
            this.destroyed ||
            this.rescheduleFrame !== undefined ||
            this.cancelResume !== undefined
        )
            return;
        const next = this.nextEntry();
        if (!next || this.composing || this.manipulating) return;
        const priority =
            next.rank * 5 +
            ['display', 'reserve', 'pending', 'cached', 'render'].indexOf(
                next.entry.state,
            );
        if (this.cancelPreparation) {
            if (priority >= this.scheduledPriority) return;
            this.cancelScheduledJob();
        }
        this.scheduledPriority = priority;
        this.cancelPreparation = scheduleMermaidPreparation(
            this.preparationTiming(next),
            () => {
                this.cancelPreparation = undefined;
                this.runNext();
            },
        );
    }

    private runNext() {
        if (
            !this.active ||
            this.destroyed ||
            this.composing ||
            this.manipulating
        )
            return;
        const next = this.nextEntry();
        if (!next) return;
        const { entry } = next;
        if (mermaidPreparationDelay(this.preparationTiming(next)) > 0) {
            this.schedule();
            return;
        }
        if (entry.state === 'pending') void this.lookup(entry);
        else if (entry.state === 'display' || entry.state === 'reserve') {
            mountNextMermaidPreview(
                entry,
                this.viewport.near,
                this.viewport.observed,
            );
            this.scheduleAfterPreviewMutation();
            return;
        } else if (entry.state === 'cached') void this.prepareCached(entry);
        else void this.render(entry);
        this.schedule();
    }

    private scheduleAfterPreviewMutation() {
        // Let the browser lay out inserted SVGs before reading the next job's bounds.
        this.rescheduleFrame = requestAnimationFrame(() => {
            this.rescheduleFrame = undefined;
            this.schedule();
        });
    }

    private isCurrent(entry: Entry) {
        return (
            !this.destroyed &&
            this.entries.get(entry.source) === entry &&
            entry.subscribers.size > 0
        );
    }

    private async lookup(entry: Entry) {
        entry.state = 'lookup';
        this.lookups += 1;
        try {
            const preview = await measureEditorAsync(
                'mermaid.cache-lookup',
                () =>
                    fetchSavedMermaidPreview(
                        this.workspaceId,
                        this.nodeId,
                        entry.source,
                        this.controller.signal,
                    ),
            );
            if (!this.isCurrent(entry)) return;
            if (preview) {
                entry.persisted = true;
                entry.preview = preview;
            }
            entry.state = preview ? 'cached' : 'render';
            entry.queuedAt = performance.now();
        } catch {
            if (this.isCurrent(entry)) entry.state = 'render';
        } finally {
            this.lookups -= 1;
            if (entry.subscribers.size === 0) this.entries.delete(entry.source);
            this.schedule();
        }
    }

    private async render(entry: Entry) {
        this.rendering = true;
        adjustEditorPerformanceCounter('mermaid.active-jobs', 1);
        recordEditorDuration('mermaid.queue-wait', entry.queuedAt);
        // Remove the active job from selection while Mermaid's non-interruptible render runs.
        entry.state = 'lookup';
        try {
            const preview =
                entry.preview ??
                (await renderMermaidPreview(
                    entry.source,
                    () => this.active && this.isCurrent(entry),
                ));
            if (!preview) {
                if (this.isCurrent(entry)) entry.state = 'render';
                return;
            }
            if (this.isCurrent(entry)) {
                await this.complete(entry, preview);
                this.persist(entry);
            }
        } catch {
            if (this.isCurrent(entry)) {
                if (this.active) showMermaidRenderError(entry);
                else {
                    entry.state = 'error';
                    entry.error =
                        'Diagram syntax could not be rendered. The source is preserved.';
                }
            }
        } finally {
            this.rendering = false;
            adjustEditorPerformanceCounter('mermaid.active-jobs', -1);
            this.lastRenderFinished = performance.now();
            if (entry.subscribers.size === 0) this.entries.delete(entry.source);
            this.schedule();
        }
    }

    private async prepareCached(entry: Entry) {
        this.preparingCache = true;
        entry.state = 'lookup';
        try {
            await this.complete(entry, entry.preview!);
        } catch {
            if (this.isCurrent(entry)) {
                entry.preview = undefined;
                entry.sanitized = false;
                entry.persisted = false;
                entry.state = 'render';
            }
        } finally {
            this.preparingCache = false;
            if (entry.subscribers.size === 0) this.entries.delete(entry.source);
            this.schedule();
        }
    }

    private async complete(entry: Entry, preview: CachedPreview) {
        if (!this.isCurrent(entry)) return;
        entry.preview = preview;
        if (!this.active) {
            entry.state = 'cached';
            return;
        }
        const sanitized = entry.sanitized
            ? preview
            : await measureEditorAsync('mermaid.svg-sanitize', () =>
                  sanitizeMermaidPreview(
                      preview,
                      () => this.active && this.isCurrent(entry),
                  ),
              );
        if (!this.isCurrent(entry)) return;
        if (!sanitized) {
            entry.state = 'cached';
            return;
        }
        entry.sanitized = true;
        entry.preview = sanitized;
        if (!this.active) {
            entry.state = 'cached';
            return;
        }
        entry.dimensions = readMermaidPreviewDimensions(sanitized);
        entry.state = 'reserve';
        if (!this.firstReady) {
            this.firstReady = true;
            markEditorPerformance(
                `document.${this.nodeId}.first-mermaid-ready`,
            );
        }
    }

    private persist(entry: Entry) {
        if (
            !this.active ||
            !this.isCurrent(entry) ||
            !entry.sanitized ||
            !entry.preview ||
            entry.persisted ||
            entry.persistPending ||
            this.persisting >= 2 ||
            entry.attemptedSave === this.saveGeneration
        )
            return;
        entry.persistPending = true;
        this.persisting += 1;
        entry.attemptedSave = this.saveGeneration;
        void measureEditorAsync('mermaid.cache-persistence', async () => {
            entry.persisted = await persistMermaidPreview(
                this.workspaceId,
                this.nodeId,
                entry.source,
                entry.preview!,
                this.controller.signal,
            );
        })
            .catch(() => undefined)
            .finally(() => {
                entry.persistPending = false;
                this.persisting -= 1;
                for (const pending of this.entries.values()) {
                    if (this.persisting >= 2) break;
                    this.persist(pending);
                }
            });
    }

    destroy() {
        this.destroyed = true;
        this.cancelScheduledJob();
        if (this.viewportTimer !== undefined) clearTimeout(this.viewportTimer);
        if (this.rescheduleFrame !== undefined)
            cancelAnimationFrame(this.rescheduleFrame);
        this.cancelResume?.();
        this.cancelResume = undefined;
        this.controller.abort();
        this.viewport.pause();
        this.entries.clear();
        this.elementEntries.clear();
    }
}
