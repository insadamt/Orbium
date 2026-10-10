export class MarkdownBlockHandleMotion {
    private animation: Animation | null = null;
    private top: number | null = null;
    private blockFrom: number | null = null;

    constructor(private readonly element: HTMLElement) {}

    measureVisibleTop(origin: number, scale: number) {
        return this.top !== null && !this.element.hidden
            ? (this.element.getBoundingClientRect().top - origin) / scale
            : null;
    }

    place({
        top,
        visibleTop,
        blockFrom,
        animate,
    }: {
        top: number;
        visibleTop: number | null;
        blockFrom: number;
        animate: boolean;
    }) {
        const changesBlock = this.blockFrom !== blockFrom;
        if (
            this.top !== null &&
            Math.abs(this.top - top) < 0.5 &&
            !changesBlock &&
            !this.element.hidden
        )
            return;
        this.finish();
        this.top = top;
        this.blockFrom = blockFrom;
        this.element.style.top = `${top}px`;
        this.element.hidden = false;
        if (
            !animate ||
            !changesBlock ||
            visibleTop === null ||
            Math.abs(visibleTop - top) < 0.5 ||
            window.matchMedia('(prefers-reduced-motion: reduce)').matches
        )
            return;
        this.animation = this.element.animate(
            [
                { transform: `translateY(${visibleTop - top}px)` },
                { transform: 'translateY(0)' },
            ],
            { duration: 150, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
        );
    }

    finish() {
        this.animation?.cancel();
        this.animation = null;
    }

    hide() {
        this.finish();
        this.element.hidden = true;
        this.top = null;
        this.blockFrom = null;
    }
}
