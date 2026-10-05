import type {
    MermaidPreviewEntry as Entry,
    MermaidSubscriber as Subscriber,
} from './mermaid-preview-entry';
import {
    findEditorScrollContainer,
    rankMermaidElements,
    mermaidPreparationViewports,
} from './mermaid-viewport';
import {
    fetchSavedMermaidPreview,
    persistMermaidPreview,
} from './mermaid-cache-api';
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

const interactionPauseMs = 140;
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
    private timer?: number;
    private idle?: number;
    private viewportTimer?: number;
    private warmTimer?: number;
    private warmIdle?: number;
    private rendering = false;
    private lookups = 0;
    private persisting = 0;
    private started = false;
    private destroyed = false;
    private direction = 1;
    private previousScroll = 0;
    private lastInteraction = 0;
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
        this.observer?.observe(element);
        if (entry.state === 'ready') {
            entry.state = 'display';
            entry.queuedAt = performance.now();
        }
        if (entry.state === 'error') subscriber(undefined, entry.error);
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
        this.lastInteraction = performance.now();
        this.cancelScheduledJob();
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
                    this.cancelScheduledJob();
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
        const root = this.scrollContainer?.getBoundingClientRect();
        const ranked: { entry: Entry; rank: number; distance: number }[] = [];
        for (const entry of this.entries.values()) {
            if (
                entry.subscribers.size === 0 ||
                !['pending', 'render', 'display'].includes(entry.state)
            )
                continue;
            if (
                [...entry.subscribers.keys()].every(
                    (element) => element.dataset.mermaidEditing === 'true',
                )
            )
                continue;
            const priority = rankMermaidElements(
                entry.subscribers.keys(),
                this.near,
                !!this.observer,
                root,
                this.direction,
            );
            if (entry.state === 'display' && priority.rank === 3) continue;
            ranked.push({ entry, ...priority });
        }
        return ranked.sort(
            (a, b) =>
                a.rank - b.rank ||
                a.distance - b.distance ||
                a.entry.queuedAt - b.entry.queuedAt,
        );
    }

    private cancelScheduledJob() {
        if (this.timer !== undefined) clearTimeout(this.timer);
        if (this.idle !== undefined) cancelIdleCallback(this.idle);
        this.timer = undefined;
        this.idle = undefined;
    }

    private schedule() {
        if (
            !this.started ||
            this.destroyed ||
            this.timer !== undefined ||
            this.idle !== undefined
        )
            return;
        const candidates = this.rankedEntries();
        const next = candidates.find(({ entry }) =>
            entry.state === 'pending' ? this.lookups < 4 : !this.rendering,
        );
        if (!next || this.composing || this.manipulating) return;
        const run = () => {
            this.timer = undefined;
            this.idle = undefined;
            this.runNext();
        };
        if (next.rank === 0 && next.entry.state === 'pending') {
            this.timer = window.setTimeout(run, 0);
        } else {
            const pause = Math.max(
                interactionPauseMs - (performance.now() - this.lastInteraction),
                next.entry.state === 'pending'
                    ? 0
                    : 80 - (performance.now() - this.lastRenderFinished),
            );
            if (pause > 0) {
                this.timer = window.setTimeout(() => {
                    this.timer = undefined;
                    this.schedule();
                }, pause);
            } else if (typeof requestIdleCallback === 'function') {
                this.idle = requestIdleCallback(
                    (deadline) => {
                        if (
                            !deadline.didTimeout &&
                            deadline.timeRemaining() < 8
                        ) {
                            this.idle = undefined;
                            this.schedule();
                            return;
                        }
                        run();
                    },
                    { timeout: next.rank < 3 ? 500 : 1500 },
                );
            } else {
                this.timer = window.setTimeout(run, 32);
            }
        }
    }

    private runNext() {
        if (this.destroyed) return;
        const next = this.rankedEntries().find(({ entry }) =>
            entry.state === 'pending' ? this.lookups < 4 : !this.rendering,
        );
        if (!next) return;
        const { entry, rank } = next;
        if (
            rank !== 0 &&
            performance.now() - this.lastInteraction < interactionPauseMs
        ) {
            this.schedule();
            return;
        }
        if (entry.state === 'pending') void this.lookup(entry);
        else void this.render(entry);
        this.schedule();
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
            entry.state = 'render';
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
            if (this.isCurrent(entry)) {
                entry.state = 'error';
                entry.error =
                    'Diagram syntax could not be rendered. The source is preserved.';
                for (const subscriber of entry.subscribers.values())
                    subscriber(undefined, entry.error);
            }
        } finally {
            this.rendering = false;
            this.lastRenderFinished = performance.now();
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
        entry.state = 'ready';
        for (const [element, subscriber] of entry.subscribers) {
            if (
                (this.observer && !this.near.has(element)) ||
                entry.displayed.has(element)
            )
                continue;
            subscriber(entry.preview);
            entry.displayed.add(element);
        }
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
