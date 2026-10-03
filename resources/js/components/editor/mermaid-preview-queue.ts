import type { PreviewPriority } from './mermaid-preview-proximity';

type PreviewJob = {
    render: () => Promise<void>;
    getPriority: () => PreviewPriority | null;
};

const pendingJobs = new Set<PreviewJob>();
let rendering = false;
let scheduledTimer: number | undefined;
let scheduledIdleCallback: number | undefined;
let lastScrollAt = 0;
let listeningForScroll = false;
const PREPARATION_SCROLL_PAUSE = 120;

function cancelScheduledPreview() {
    if (scheduledTimer !== undefined) window.clearTimeout(scheduledTimer);
    if (scheduledIdleCallback !== undefined)
        window.cancelIdleCallback(scheduledIdleCallback);
    scheduledTimer = undefined;
    scheduledIdleCallback = undefined;
}

function findNextPreview() {
    let nextJob: PreviewJob | undefined;
    let nextPriority: PreviewPriority | undefined;
    for (const job of pendingJobs) {
        const priority = job.getPriority();
        if (!priority) continue;
        if (
            !nextPriority ||
            (priority.visible && !nextPriority.visible) ||
            (priority.visible === nextPriority.visible &&
                priority.distance < nextPriority.distance)
        ) {
            nextJob = job;
            nextPriority = priority;
        }
    }
    return nextJob && nextPriority
        ? { job: nextJob, priority: nextPriority }
        : null;
}

function scheduleNextPreview() {
    if (
        rendering ||
        scheduledTimer !== undefined ||
        scheduledIdleCallback !== undefined
    )
        return;
    const nextPreview = findNextPreview();
    if (!nextPreview) return;
    if (nextPreview.priority.visible) {
        scheduledTimer = window.setTimeout(() => {
            scheduledTimer = undefined;
            void renderNextPreview();
        }, 0);
        return;
    }

    const remainingPause = Math.max(
        0,
        PREPARATION_SCROLL_PAUSE - (performance.now() - lastScrollAt),
    );
    if (remainingPause > 0) {
        scheduledTimer = window.setTimeout(() => {
            scheduledTimer = undefined;
            scheduleNextPreview();
        }, remainingPause);
    } else if (typeof window.requestIdleCallback === 'function') {
        scheduledIdleCallback = window.requestIdleCallback(
            () => {
                scheduledIdleCallback = undefined;
                void renderNextPreview();
            },
            { timeout: 1000 },
        );
    } else {
        scheduledTimer = window.setTimeout(() => {
            scheduledTimer = undefined;
            void renderNextPreview();
        }, 0);
    }
}

async function renderNextPreview() {
    if (rendering) return;
    const nextPreview = findNextPreview();
    if (!nextPreview) return;
    if (
        !nextPreview.priority.visible &&
        performance.now() - lastScrollAt < PREPARATION_SCROLL_PAUSE
    ) {
        scheduleNextPreview();
        return;
    }
    pendingJobs.delete(nextPreview.job);
    rendering = true;
    try {
        await nextPreview.job.render();
    } finally {
        rendering = false;
        scheduleNextPreview();
    }
}

function deferPreviewsDuringScroll() {
    lastScrollAt = performance.now();
    cancelScheduledPreview();
    scheduleNextPreview();
}

export function queueMermaidPreview(job: PreviewJob): () => void {
    if (!listeningForScroll) {
        window.addEventListener('scroll', deferPreviewsDuringScroll, {
            capture: true,
            passive: true,
        });
        window.addEventListener('resize', deferPreviewsDuringScroll, {
            passive: true,
        });
        listeningForScroll = true;
    }
    pendingJobs.add(job);
    cancelScheduledPreview();
    scheduleNextPreview();
    return () => {
        pendingJobs.delete(job);
        if (pendingJobs.size === 0) {
            cancelScheduledPreview();
            window.removeEventListener(
                'scroll',
                deferPreviewsDuringScroll,
                true,
            );
            window.removeEventListener('resize', deferPreviewsDuringScroll);
            listeningForScroll = false;
        }
    };
}
