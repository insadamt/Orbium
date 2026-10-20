import { scheduleEditorIdleWork } from '@/components/editor/schedule-editor-idle-work';

type PreviewJob = { run: () => Promise<void> };
const pendingPreviews = new Set<PreviewJob>();
let activePreviews = 0;
let cancelScheduledPreview: (() => void) | undefined;

function scheduleNextPreview() {
    if (cancelScheduledPreview || activePreviews >= 2 || !pendingPreviews.size)
        return;
    //
    // Full linked Documents can contain many rich blocks; stagger initialization instead of starting every card in one turn.
    //
    cancelScheduledPreview = scheduleEditorIdleWork(() => {
        cancelScheduledPreview = undefined;
        const job = pendingPreviews.values().next().value;
        if (!job) return;
        pendingPreviews.delete(job);
        activePreviews++;
        void job.run().finally(() => {
            activePreviews--;
            scheduleNextPreview();
        });
        scheduleNextPreview();
    });
}

export function scheduleBoardDocumentPreview(run: () => Promise<void>) {
    const job = { run };
    pendingPreviews.add(job);
    scheduleNextPreview();
    return () => {
        pendingPreviews.delete(job);
        if (!pendingPreviews.size && cancelScheduledPreview) {
            cancelScheduledPreview();
            cancelScheduledPreview = undefined;
        }
    };
}
