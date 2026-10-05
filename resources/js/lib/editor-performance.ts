import {
    startEditorScrollProfiling,
    type EditorPerformanceSample,
} from './editor-scroll-performance';

export const editorProfilingEnabled =
    import.meta.env?.DEV || import.meta.env?.VITE_ORBIUM_PROFILE === 'true';

type Sample = EditorPerformanceSample;
const samples: Sample[] = [];
const marks = new Map<string, number>();
let output: HTMLScriptElement | undefined;
let publicationTimer: ReturnType<typeof setTimeout> | undefined;
let completedScrollCaptures = 0;

function publish() {
    if (!editorProfilingEnabled || typeof document === 'undefined') return;
    clearTimeout(publicationTimer);
    // Updating diagnostic DOM during scrolling can itself force expensive layout.
    publicationTimer = setTimeout(publishSnapshot, 250);
}

function publishSnapshot() {
    if (!output?.isConnected) {
        output = document.createElement('script');
        output.type = 'application/json';
        output.dataset.orbiumPerformance = '';
        document.head.append(output);
    }
    output.textContent = JSON.stringify({
        marks: Object.fromEntries(marks),
        samples,
    });
    output.dataset.scrollCapture = String(completedScrollCaptures);
}

export function markEditorPerformance(
    name: string,
    options: { once?: boolean } = {},
) {
    if (!editorProfilingEnabled) return;
    if (options.once && marks.has(name)) return;
    const key = `orbium:${name}`;
    performance.clearMarks(key);
    performance.mark(key);
    marks.set(name, performance.now());
    publish();
}

export function resetOpeningPreviewPerformance() {
    if (editorProfilingEnabled) marks.delete('opening-preview.mounted');
}

export function recordEditorDuration(name: string, startTime: number) {
    if (!editorProfilingEnabled) return;
    const duration = performance.now() - startTime;
    performance.clearMeasures(`orbium:${name}`);
    performance.measure(`orbium:${name}`, { start: startTime, duration });
    samples.push({ name, duration, startTime });
    if (samples.length > 500) samples.shift();
    publish();
    return duration;
}

export function measureEditorWork<T>(name: string, work: () => T): T {
    if (!editorProfilingEnabled) return work();
    const start = performance.now();
    try {
        return work();
    } finally {
        recordEditorDuration(name, start);
    }
}

export async function measureEditorAsync<T>(
    name: string,
    work: () => Promise<T>,
): Promise<T> {
    if (!editorProfilingEnabled) return work();
    const start = performance.now();
    try {
        return await work();
    } finally {
        recordEditorDuration(name, start);
    }
}

function summary() {
    return [...new Set(samples.map((sample) => sample.name))].map((name) => {
        const durations = samples
            .filter((sample) => sample.name === name)
            .map((sample) => sample.duration)
            .sort((a, b) => a - b);
        return {
            name,
            count: durations.length,
            p50: durations[Math.ceil(durations.length * 0.5) - 1],
            p95: durations[Math.ceil(durations.length * 0.95) - 1],
            worst: durations.at(-1),
        };
    });
}

declare global {
    interface Window {
        __ORBIUM_PERF__?: {
            summary: typeof summary;
            snapshot: () => {
                marks: Record<string, number>;
                samples: Sample[];
            };
            reset: () => void;
        };
    }
}

if (editorProfilingEnabled && typeof window !== 'undefined') {
    startEditorScrollProfiling((batch, completed) => {
        samples.push(...batch);
        if (completed) completedScrollCaptures++;
        if (samples.length > 500) samples.splice(0, samples.length - 500);
        publish();
    });
    window.__ORBIUM_PERF__ = {
        summary,
        snapshot: () => ({
            marks: Object.fromEntries(marks),
            samples: [...samples],
        }),
        reset: () => {
            samples.length = 0;
            marks.clear();
            performance.getEntries().forEach((entry) => {
                if (!entry.name.startsWith('orbium:')) return;
                performance.clearMarks(entry.name);
                performance.clearMeasures(entry.name);
            });
            publish();
        },
    };
    if (PerformanceObserver.supportedEntryTypes.includes('longtask')) {
        new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                samples.push({
                    name: 'main-thread.long-task',
                    duration: entry.duration,
                    startTime: entry.startTime,
                });
            }
            if (samples.length > 500) samples.splice(0, samples.length - 500);
            publish();
        }).observe({ type: 'longtask', buffered: true });
    }
}
