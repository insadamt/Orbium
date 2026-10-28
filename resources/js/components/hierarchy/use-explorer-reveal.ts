// Scrolls an explicit Reveal target into view after explorer layout settles.
// Depends on the mounted card and ResizeObserver so natural Gallery can measure first.
import { useEffect, type RefObject } from 'react';

export function useExplorerReveal({
    containerRef,
    focusId,
    requestKey,
    targetVisible,
}: {
    containerRef: RefObject<HTMLElement | null>;
    focusId: number;
    requestKey: string;
    targetVisible: boolean;
}) {
    useEffect(() => {
        if (!targetVisible || !Number.isSafeInteger(focusId) || focusId <= 0)
            return;
        const container = containerRef.current;
        const target = container?.querySelector<HTMLElement>(
            `[data-node-id="${focusId}"]`,
        );
        if (!container || !target) return;

        let scrollTimer: ReturnType<typeof setTimeout>;
        const observer = new ResizeObserver(scheduleReveal);
        function scheduleReveal() {
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                target?.scrollIntoView({
                    block: 'center',
                    behavior: 'instant',
                });
            }, 80);
        }
        function stopReveal() {
            clearTimeout(scrollTimer);
            observer.disconnect();
            window.removeEventListener('wheel', stopReveal);
            window.removeEventListener('pointerdown', stopReveal);
            window.removeEventListener('keydown', stopReveal);
        }

        // Briefly follow masonry measurements, but never fight deliberate scrolling.
        observer.observe(container);
        observer.observe(target);
        if (target.parentElement) observer.observe(target.parentElement);
        window.addEventListener('wheel', stopReveal, { passive: true });
        window.addEventListener('pointerdown', stopReveal, { passive: true });
        window.addEventListener('keydown', stopReveal);
        scheduleReveal();
        const settleTimer = setTimeout(stopReveal, 1000);
        return () => {
            clearTimeout(settleTimer);
            stopReveal();
        };
    }, [containerRef, focusId, requestKey, targetVisible]);
}
