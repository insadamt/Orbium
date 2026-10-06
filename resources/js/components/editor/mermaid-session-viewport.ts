import { warmMermaidRenderer } from './mermaid-preview-renderer';
import {
    findEditorScrollContainer,
    mermaidPreparationViewports,
} from './mermaid-viewport';
import { adjustEditorPerformanceCounter } from '@/lib/editor-performance';

const interactionEvents = [
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

export class MermaidSessionViewport {
    readonly near = new Set<HTMLElement>();
    scrollContainer: HTMLElement | null = null;
    private observer?: IntersectionObserver;
    private editorDom?: HTMLElement;
    private active = false;
    private generation = 0;
    private warmTimer?: number;
    private warmIdle?: number;

    constructor(
        private callbacks: {
            elements: () => Iterable<HTMLElement>;
            interaction: (event: Event) => void;
            changed: () => void;
            nearby: (element: HTMLElement) => void;
        },
    ) {}

    get observed() {
        return !!this.observer;
    }

    start(editorDom: HTMLElement) {
        this.editorDom = editorDom;
        this.scrollContainer = findEditorScrollContainer(editorDom);
    }

    resume() {
        if (this.active || !this.editorDom) return;
        this.active = true;
        window.addEventListener('scroll', this.onScroll, {
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
        for (const event of interactionEvents)
            this.editorDom.addEventListener(event, this.onInteraction, {
                passive: true,
            });
        this.observeViewport();
        this.warmTimer = window.setTimeout(() => {
            this.warmTimer = undefined;
            if (
                !this.active ||
                this.callbacks.elements()[Symbol.iterator]().next().done
            )
                return;
            const warm = () => {
                this.warmIdle = undefined;
                if (this.active)
                    void warmMermaidRenderer(() => this.active).catch(
                        () => undefined,
                    );
            };
            if (typeof requestIdleCallback === 'function')
                this.warmIdle = requestIdleCallback(warm, { timeout: 1500 });
            else warm();
        }, 250);
    }

    pause() {
        if (!this.active) return;
        this.active = false;
        this.generation++;
        if (this.warmTimer !== undefined) clearTimeout(this.warmTimer);
        if (this.warmIdle !== undefined) cancelIdleCallback(this.warmIdle);
        this.warmTimer = this.warmIdle = undefined;
        this.disconnectObserver();
        this.near.clear();
        window.removeEventListener('scroll', this.onScroll, true);
        window.removeEventListener('resize', this.onResize);
        window.removeEventListener('pointerup', this.onInteraction);
        window.removeEventListener('pointercancel', this.onInteraction);
        for (const event of interactionEvents)
            this.editorDom?.removeEventListener(event, this.onInteraction);
    }

    observe(element: HTMLElement) {
        if (this.active) this.observer?.observe(element);
    }
    unobserve(element: HTMLElement) {
        this.observer?.unobserve(element);
        this.near.delete(element);
    }

    private onInteraction = (event: Event) => {
        if (this.active) this.callbacks.interaction(event);
    };
    private onScroll = () => {
        if (this.active) this.callbacks.changed();
    };
    private onResize = () => {
        if (!this.active) return;
        this.observeViewport();
        this.callbacks.changed();
    };

    private disconnectObserver() {
        if (!this.observer) return;
        this.observer.disconnect();
        this.observer = undefined;
        adjustEditorPerformanceCounter('mermaid.active-observers', -1);
    }

    private observeViewport() {
        this.disconnectObserver();
        this.near.clear();
        const generation = ++this.generation;
        if (typeof IntersectionObserver !== 'undefined') {
            const height =
                this.scrollContainer?.clientHeight ?? window.innerHeight;
            this.observer = new IntersectionObserver(
                (entries) => {
                    if (!this.active || generation !== this.generation) return;
                    for (const entry of entries) {
                        const element = entry.target as HTMLElement;
                        if (entry.isIntersecting) {
                            this.near.add(element);
                            this.callbacks.nearby(element);
                        } else this.near.delete(element);
                    }
                    this.callbacks.changed();
                },
                {
                    root: this.scrollContainer,
                    rootMargin: `${height * mermaidPreparationViewports}px 0px`,
                },
            );
            adjustEditorPerformanceCounter('mermaid.active-observers', 1);
            for (const element of this.callbacks.elements())
                this.observer.observe(element);
        }
    }
}
