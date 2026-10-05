import type { MermaidPreviewEntry } from './mermaid-preview-entry';

type PreparationTiming = {
    entry: MermaidPreviewEntry;
    rank: number;
    lastInteraction: number;
    lastScroll: number;
    lastRenderFinished: number;
};

export function mermaidPreparationDelay(timing: PreparationTiming): number {
    if (timing.entry.state !== 'render') return 0;
    const now = performance.now();
    return Math.max(
        0,
        140 - (now - timing.lastInteraction),
        80 - (now - timing.lastRenderFinished),
        timing.rank === 3 ? 140 - (now - timing.lastScroll) : 0,
    );
}

export function scheduleMermaidPreparation(
    timing: PreparationTiming,
    run: () => void,
): () => void {
    let timer: number | undefined;
    let idle: number | undefined;
    let frame: number | undefined;
    let cancelled = false;
    const schedule = () => {
        if (cancelled) return;
        if (timing.entry.state === 'display') {
            frame = requestAnimationFrame(run);
        } else if (timing.entry.state === 'pending') {
            timer = window.setTimeout(run, 0);
        } else if (typeof requestIdleCallback === 'function') {
            const deadlineAt =
                performance.now() + (timing.rank < 3 ? 120 : 1500);
            const prepare = (deadline: IdleDeadline) => {
                if (cancelled) return;
                if (!deadline.didTimeout && deadline.timeRemaining() < 8) {
                    idle = requestIdleCallback(prepare, {
                        timeout: Math.max(1, deadlineAt - performance.now()),
                    });
                } else run();
            };
            idle = requestIdleCallback(prepare, {
                timeout: timing.rank < 3 ? 120 : 1500,
            });
        } else timer = window.setTimeout(run, 16);
    };
    const delay = mermaidPreparationDelay(timing);
    if (delay > 0) timer = window.setTimeout(schedule, delay);
    else schedule();
    return () => {
        cancelled = true;
        if (timer !== undefined) clearTimeout(timer);
        if (idle !== undefined) cancelIdleCallback(idle);
        if (frame !== undefined) cancelAnimationFrame(frame);
    };
}
