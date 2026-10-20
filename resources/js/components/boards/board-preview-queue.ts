type PreviewJob = { run: () => Promise<void>; visible: () => boolean };
const pendingPreviews = new Set<PreviewJob>();
let activePreviews = 0;
let scheduledPreview: ReturnType<typeof setTimeout> | undefined;

function scheduleNextPreview() {
    if (
        scheduledPreview !== undefined ||
        activePreviews >= 2 ||
        !pendingPreviews.size
    )
        return;
    //
    // Keep bounded fetch concurrency without waiting for idle time that continuous panning can postpone.
    //
    scheduledPreview = setTimeout(() => {
        scheduledPreview = undefined;
        const job =
            [...pendingPreviews].find((preview) => preview.visible()) ??
            pendingPreviews.values().next().value;
        if (!job) return;
        pendingPreviews.delete(job);
        activePreviews++;
        void job.run().finally(() => {
            activePreviews--;
            scheduleNextPreview();
        });
        scheduleNextPreview();
    }, 0);
}

export function scheduleBoardDocumentPreview(
    run: () => Promise<void>,
    visible: () => boolean,
) {
    const job = { run, visible };
    pendingPreviews.add(job);
    scheduleNextPreview();
    return () => {
        pendingPreviews.delete(job);
        if (!pendingPreviews.size && scheduledPreview !== undefined) {
            clearTimeout(scheduledPreview);
            scheduledPreview = undefined;
        }
    };
}
