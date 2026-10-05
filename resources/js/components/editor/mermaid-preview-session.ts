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
import {
    findEditorScrollContainer,
    mermaidPreparationViewports,
} from './mermaid-viewport';
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
    warmMermaidRenderer,
    type CachedPreview,
} from './mermaid-preview-renderer';
import {
    markEditorPerformance,
    measureEditorAsync,
    recordEditorDuration,
} from '@/lib/editor-performance';

const editorInteractionEvents = [
    'keydown',
    'pointerdown',
    'pointermove',
    'wheel',
    'input',
    'compositionstart',
    'compositionend',
    'dragstart',
    'dragend',
];

export class MermaidPreviewSession {
    private entries = new Map<string, Entry>();
    private near = new Set<HTMLElement>();
    private observer?: IntersectionObserver;
    private scrollContainer: HTMLElement | null = null;
    private editorDom?: HTMLElement;
    private controller = new AbortController();
    private cancelPreparation?: () => void;
    private scheduledPriority = Infinity;
    private viewportTimer?: number;
    private rescheduleFrame?: number;
    private warmTimer?: number;
    private warmIdle?: number;
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
        if (entry.dimensions) subscriber({ dimensions: entry.dimensions });
        this.observer?.observe(element);
        if (entry.state === 'ready') {
            entry.state = 'display';
            entry.queuedAt = performance.now();
        }
        if (entry.state === 'error') subscriber({ error: entry.error });
        this.schedule();
        return () => {
            entry.subscribers.delete(element);
            entry.displayed.delete(element);
            this.observer?.unobserve(element);
            this.near.delete(element);
            if (entry.subscribers.size === 0 && entry.state !== 'lookup')
                this.entries.delete(source);
        };
    }

    start(editorDom: HTMLElement) {
        if (this.started || this.destroyed) return;
        this.started = true;
        this.editorDom = editorDom;
        this.scrollContainer = findEditorScrollContainer(editorDom);
        this.previousScroll = this.scrollPosition();
        this.observeViewport();
        window.addEventListener('scroll', this.onViewportChange, {
            capture: true,
            passive: true,
        });
        window.addEventListener('resize', this.onResize, { passive: true });
        window.addEventListener('pointerup', this.onInteraction, {
            passive: true,
        });
        window.addEventListener('pointercancel', this.onInteraction, {
            passive: true,
        });
        for (const event of editorInteractionEvents) {
            editorDom.addEventListener(event, this.onInteraction, {
                passive: true,
            });
        }
        // Warming starts after the interactive frame, never during NodeView construction.
        this.warmTimer = window.setTimeout(() => {
            this.warmTimer = undefined;
            if (!this.destroyed && this.entries.size > 0) {
                const warm = () => {
                    this.warmIdle = undefined;
                    if (!this.destroyed)
                        void warmMermaidRenderer().catch(() => undefined);
                };
                if (typeof requestIdleCallback === 'function')
                    this.warmIdle = requestIdleCallback(warm, {
                        timeout: 1500,
                    });
                else warm();
            }
        }, 250);
        this.schedule();
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
        return this.scrollContainer?.scrollTop ?? window.scrollY;
    }

    private onInteraction = (event: Event) => {
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

    private onResize = () => {
        this.observeViewport();
        this.onViewportChange();
    };

    private observeViewport() {
        this.observer?.disconnect();
        this.near.clear();
        if (typeof IntersectionObserver !== 'undefined') {
            const height =
                this.scrollContainer?.clientHeight ?? window.innerHeight;
            this.observer = new IntersectionObserver(
                (entries) => {
                    for (const entry of entries) {
                        const element = entry.target as HTMLElement;
                        if (entry.isIntersecting) {
                            this.near.add(element);
                            for (const job of this.entries.values()) {
                                if (
                                    job.subscribers.has(element) &&
                                    job.state === 'ready' &&
                                    !job.displayed.has(element)
                                ) {
                                    job.state = 'display';
                                    job.queuedAt = performance.now();
                                }
                            }
                        } else this.near.delete(element);
                    }
                    this.schedule();
                },
                {
                    root: this.scrollContainer,
                    rootMargin: `${height * mermaidPreparationViewports}px 0px`,
                },
            );
        }
        for (const entry of this.entries.values()) {
            for (const element of entry.subscribers.keys())
                this.observer?.observe(element);
        }
    }

    private rankedEntries() {
        return rankMermaidPreparationEntries({
            entries: this.entries.values(),
            near: this.near,
            observed: !!this.observer,
            scrollContainer: this.scrollContainer,
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
            !this.started ||
            this.destroyed ||
            this.rescheduleFrame !== undefined
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
        if (this.destroyed || this.composing || this.manipulating) return;
        const next = this.nextEntry();
        if (!next) return;
        const { entry } = next;
        if (mermaidPreparationDelay(this.preparationTiming(next)) > 0) {
            this.schedule();
            return;
        }
        if (entry.state === 'pending') void this.lookup(entry);
        else if (entry.state === 'display' || entry.state === 'reserve') {
            mountNextMermaidPreview(entry, this.near, !!this.observer);
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
        recordEditorDuration('mermaid.queue-wait', entry.queuedAt);
        // Remove the active job from selection while Mermaid's non-interruptible render runs.
        entry.state = 'lookup';
        try {
            const preview =
                entry.preview ?? (await renderMermaidPreview(entry.source));
            if (!entry.preview) entry.sanitized = true;
            if (this.isCurrent(entry)) {
                await this.complete(entry, preview);
                this.persist(entry);
            }
        } catch {
            if (this.isCurrent(entry)) showMermaidRenderError(entry);
        } finally {
            this.rendering = false;
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
        const sanitized = entry.sanitized
            ? preview
            : await measureEditorAsync('mermaid.svg-sanitize', () =>
                  sanitizeMermaidPreview(preview),
              );
        entry.sanitized = true;
        if (!this.isCurrent(entry)) return;
        entry.preview = sanitized;
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
            !this.isCurrent(entry) ||
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
        if (this.warmTimer !== undefined) clearTimeout(this.warmTimer);
        if (this.warmIdle !== undefined) cancelIdleCallback(this.warmIdle);
        this.controller.abort();
        this.observer?.disconnect();
        window.removeEventListener('scroll', this.onViewportChange, true);
        window.removeEventListener('resize', this.onResize);
        window.removeEventListener('pointerup', this.onInteraction);
        window.removeEventListener('pointercancel', this.onInteraction);
        for (const event of editorInteractionEvents)
            this.editorDom?.removeEventListener(event, this.onInteraction);
        this.entries.clear();
        this.near.clear();
    }
}
