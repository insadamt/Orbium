type PreviewJob = {
    render: () => Promise<void>;
    isVisible: () => boolean;
};

const pendingJobs = new Set<PreviewJob>();
let rendering = false;
let scheduledTimer: number | undefined;
let lastScrollAt = 0;
let listeningForScroll = false;

function scheduleNextPreview() {
    if (rendering || scheduledTimer !== undefined || pendingJobs.size === 0)
        return;
    const quietFor = performance.now() - lastScrollAt;
    scheduledTimer = window.setTimeout(
        () => {
            scheduledTimer = undefined;
            void renderNextPreview();
        },
        Math.max(0, 400 - quietFor),
    );
}

async function renderNextPreview() {
    if (rendering) return;
    const nextJob = [...pendingJobs].find((job) => job.isVisible());
    if (!nextJob) return;
    pendingJobs.delete(nextJob);
    rendering = true;
    try {
        await nextJob.render();
    } finally {
        rendering = false;
        scheduleNextPreview();
    }
}

function deferPreviewsDuringScroll() {
    lastScrollAt = performance.now();
    if (scheduledTimer !== undefined) {
        window.clearTimeout(scheduledTimer);
        scheduledTimer = undefined;
    }
    scheduleNextPreview();
}

export function queueMermaidPreview(job: PreviewJob): () => void {
    if (!listeningForScroll) {
        window.addEventListener('scroll', deferPreviewsDuringScroll, {
            capture: true,
            passive: true,
        });
        listeningForScroll = true;
    }
    pendingJobs.add(job);
    scheduleNextPreview();
    return () => {
        pendingJobs.delete(job);
    };
}
