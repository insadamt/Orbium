export type EditorPerformanceSample = {
    name: string;
    duration: number;
    startTime: number;
};

type LongFrame = PerformanceEntry & {
    blockingDuration: number;
    renderStart: number;
    styleAndLayoutStart: number;
    scripts: (PerformanceEntry & {
        forcedStyleAndLayoutDuration: number;
        invoker: string;
        sourceFunctionName: string;
    })[];
};

export function startEditorScrollProfiling(
    record: (samples: EditorPerformanceSample[], completed?: boolean) => void,
) {
    let frame: number | undefined;
    let previousFrame: number | undefined;
    let startedAt = Infinity;
    let lastScroll = -Infinity;
    let pending: EditorPerformanceSample[] = [];
    const append = (name: string, duration: number, startTime: number) => {
        pending.push({ name, duration, startTime });
        if (pending.length > 500) pending.shift();
    };
    const inspectFrame = (now: number) => {
        if (now - lastScroll > 140) {
            record(pending, true);
            pending = [];
            frame = undefined;
            previousFrame = undefined;
            return;
        }
        if (previousFrame !== undefined)
            append('scroll.frame-interval', now - previousFrame, previousFrame);
        previousFrame = now;
        frame = requestAnimationFrame(inspectFrame);
    };
    window.addEventListener(
        'scroll',
        () => {
            lastScroll = performance.now();
            record([]);
            if (frame === undefined) {
                startedAt = lastScroll;
                frame = requestAnimationFrame(inspectFrame);
            }
        },
        { capture: true, passive: true },
    );
    if (
        !PerformanceObserver.supportedEntryTypes.includes(
            'long-animation-frame',
        )
    )
        return;
    new PerformanceObserver((list) => {
        const observed: EditorPerformanceSample[] = [];
        for (const entry of list.getEntries() as LongFrame[]) {
            if (
                entry.startTime + entry.duration < startedAt ||
                entry.startTime > lastScroll + 140
            )
                continue;
            observed.push({
                name: 'scroll.long-frame',
                duration: entry.duration,
                startTime: entry.startTime,
            });
            if (entry.styleAndLayoutStart > 0)
                observed.push({
                    name: 'scroll.style-layout-and-render-tail',
                    duration:
                        entry.startTime +
                        entry.duration -
                        entry.styleAndLayoutStart,
                    startTime: entry.styleAndLayoutStart,
                });
            for (const script of entry.scripts) {
                const label =
                    script.sourceFunctionName || script.invoker || 'script';
                observed.push({
                    name: `scroll.script.${label}`,
                    duration: script.duration,
                    startTime: script.startTime,
                });
                if (script.forcedStyleAndLayoutDuration > 0)
                    observed.push({
                        name: `scroll.forced-layout.${label}`,
                        duration: script.forcedStyleAndLayoutDuration,
                        startTime: script.startTime,
                    });
            }
        }
        if (observed.length) record(observed);
    }).observe({ type: 'long-animation-frame' });
}
