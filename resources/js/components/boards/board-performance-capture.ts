import type { readBoardPerformanceScene } from './board-performance-scene';

export const boardCaptureScenarios = [
    'idle',
    'warm-return',
    'pan-new',
    'pan-back',
    'zoom',
    'drag',
    'resize',
    'typing',
    'table',
    'linked-document',
    'pdf',
] as const;
type Scenario = (typeof boardCaptureScenarios)[number];
type Scene = ReturnType<typeof readBoardPerformanceScene>;
type StopReason = 'manual' | 'timeout' | 'hidden' | 'unmounted';
type DurationSample = { startTime: number; duration: number };

export function beginBoardPerformanceCapture(options: {
    scope: string;
    scenario: Scenario;
    readScene: () => Scene;
    readCommitCount: () => number;
    onFinished: (result: BoardPerformanceCaptureResult) => void;
}) {
    const before = options.readScene();
    if (
        !before ||
        !before.documentVisible ||
        !before.viewport.width ||
        !before.viewport.height
    )
        throw new Error('Capture requires a mounted, visible Board.');
    const initialCommits = options.readCommitCount();
    const startedAt = performance.now();
    const prefix = `orbium:board:p0:${options.scope}:${options.scenario}`;
    const startMark = `${prefix}:start`;
    const endMark = `${prefix}:end`;
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(prefix);
    performance.mark(startMark);
    const frameIntervals: number[] = [];
    const longTasks: DurationSample[] = [];
    let droppedFrameIntervals = 0;
    let droppedLongTasks = 0;
    let previousFrame: number | undefined;
    let finished = false;
    let result: BoardPerformanceCaptureResult | undefined;
    const supportsLongTasks =
        typeof PerformanceObserver !== 'undefined' &&
        PerformanceObserver.supportedEntryTypes.includes('longtask');
    const observer = supportsLongTasks
        ? new PerformanceObserver((list) => appendLongTasks(list.getEntries()))
        : null;

    function appendLongTasks(entries: PerformanceEntry[]) {
        for (const entry of entries) {
            if (entry.startTime < startedAt) continue;
            if (longTasks.length < 1024)
                longTasks.push({
                    startTime: entry.startTime,
                    duration: entry.duration,
                });
            else droppedLongTasks++;
        }
    }
    observer?.observe({ type: 'longtask' });
    function sampleFrame(timestamp: number) {
        if (finished) return;
        if (previousFrame !== undefined) {
            if (frameIntervals.length < 8192)
                frameIntervals.push(timestamp - previousFrame);
            else droppedFrameIntervals++;
        }
        previousFrame = timestamp;
        frame = requestAnimationFrame(sampleFrame);
    }
    let frame = requestAnimationFrame(sampleFrame);
    const timer = window.setTimeout(() => stop('timeout'), 30_000);
    const onHidden = () => {
        if (document.visibilityState !== 'visible') stop('hidden');
    };
    const onPageHide = () => stop('hidden');
    document.addEventListener('visibilitychange', onHidden);
    window.addEventListener('pagehide', onPageHide);

    function stop(reason: StopReason = 'manual') {
        if (finished) return result;
        finished = true;
        const endedAt = performance.now();
        cancelAnimationFrame(frame);
        clearTimeout(timer);
        document.removeEventListener('visibilitychange', onHidden);
        window.removeEventListener('pagehide', onPageHide);
        if (observer) appendLongTasks(observer.takeRecords());
        observer?.disconnect();
        performance.mark(endMark);
        performance.measure(prefix, { start: startedAt, end: endedAt });
        //
        // Scene scans can force layout; keep them outside the marked interaction interval.
        //
        result = {
            scope: options.scope,
            scenario: options.scenario,
            reason,
            startedAt,
            endedAt,
            durationMs: endedAt - startedAt,
            boardWorkspaceCommits: options.readCommitCount() - initialCommits,
            observedFrameIntervalMs: summarizeDurations(frameIntervals),
            windowLongTasks: {
                supported: supportsLongTasks,
                durationsMs: summarizeDurations(
                    longTasks.map((entry) => entry.duration),
                ),
                samples: longTasks,
            },
            droppedSamples: {
                frameIntervals: droppedFrameIntervals,
                longTasks: droppedLongTasks,
            },
            before,
            after: options.readScene(),
        };
        options.onFinished(result);
        return result;
    }
    return { stop };
}

function summarizeDurations(values: number[]) {
    const sorted = [...values].sort((a, b) => a - b);
    const percentile = (fraction: number) =>
        sorted.length ? sorted[Math.ceil(sorted.length * fraction) - 1] : null;
    return {
        count: sorted.length,
        median: percentile(0.5),
        p95: percentile(0.95),
        max: sorted.at(-1) ?? null,
        total: sorted.reduce((sum, value) => sum + value, 0),
    };
}

export type BoardPerformanceCaptureResult = {
    scope: string;
    scenario: Scenario;
    reason: StopReason;
    startedAt: number;
    endedAt: number;
    durationMs: number;
    boardWorkspaceCommits: number;
    observedFrameIntervalMs: ReturnType<typeof summarizeDurations>;
    windowLongTasks: {
        supported: boolean;
        durationsMs: ReturnType<typeof summarizeDurations>;
        samples: DurationSample[];
    };
    droppedSamples: { frameIntervals: number; longTasks: number };
    before: Scene;
    after: Scene;
};
