import { useLayoutEffect, useState, type RefObject } from 'react';
import { attachPaneWheelScrolling } from './split-pane-scroll';

export function usePaneFrameHeight({
    frameRef,
    isReady,
    active,
    loadVersion,
}: {
    frameRef: RefObject<HTMLIFrameElement | null>;
    isReady: boolean;
    active: boolean;
    loadVersion: number;
}) {
    const [height, setHeight] = useState(() => window.innerHeight);

    useLayoutEffect(() => {
        if (!isReady) return;
        const frame = frameRef.current;
        const paneDocument = frame?.contentDocument;
        const main = paneDocument?.querySelector<HTMLElement>('.orbium-main');
        if (!frame || !paneDocument || !main) return;
        let scheduledFrame: number | undefined;

        function measureContentHeight() {
            scheduledFrame = undefined;
            if (!frame?.getBoundingClientRect().width || !main || !paneDocument)
                return;
            paneDocument.documentElement.style.setProperty(
                '--orbium-host-viewport-height',
                `${window.innerHeight}px`,
            );
            const nextHeight = Math.ceil(main.getBoundingClientRect().height);
            if (nextHeight > 0)
                setHeight((previous) =>
                    previous === nextHeight ? previous : nextHeight,
                );
        }

        function scheduleContentMeasurement() {
            if (scheduledFrame === undefined)
                scheduledFrame = requestAnimationFrame(measureContentHeight);
        }

        const observer = new ResizeObserver(scheduleContentMeasurement);
        const pane = frame.closest<HTMLElement>('.split-pane');
        const detachWheel =
            active && pane
                ? attachPaneWheelScrolling({
                      pane,
                      eventTarget: paneDocument,
                  })
                : undefined;
        observer.observe(main);
        window.addEventListener('resize', scheduleContentMeasurement);
        measureContentHeight();
        return () => {
            observer.disconnect();
            detachWheel?.();
            window.removeEventListener('resize', scheduleContentMeasurement);
            if (scheduledFrame !== undefined)
                cancelAnimationFrame(scheduledFrame);
        };
    }, [frameRef, isReady, active, loadVersion]);

    return height;
}
