import { useLayoutEffect, useRef } from 'react';

export function useBoardWorkspace() {
    const pageRef = useRef<HTMLDivElement>(null);
    useLayoutEffect(() => {
        const page = pageRef.current;
        if (!page) return;
        let pendingFrame: number | undefined;
        const updateAvailableHeight = () => {
            pendingFrame = undefined;
            const viewportHeight =
                window.visualViewport?.height ?? window.innerHeight;
            const pageTop = page.getBoundingClientRect().top;
            //
            // The app bar wraps on smaller screens; size the canvas from its real position instead of hiding navigation.
            //
            page.style.setProperty(
                '--board-workspace-height',
                `${Math.max(280, viewportHeight - pageTop - 16)}px`,
            );
        };
        const scheduleHeightUpdate = () => {
            if (pendingFrame === undefined)
                pendingFrame = requestAnimationFrame(updateAvailableHeight);
        };
        const observer = new ResizeObserver(scheduleHeightUpdate);
        const shell = page.closest('.orbium-shell');
        for (const element of shell?.querySelectorAll(
            '.floating-top-controls, .floating-top-controls-spacer',
        ) ?? [])
            observer.observe(element);
        updateAvailableHeight();
        window.visualViewport?.addEventListener('resize', scheduleHeightUpdate);
        window.addEventListener('resize', scheduleHeightUpdate);
        return () => {
            observer.disconnect();
            window.visualViewport?.removeEventListener(
                'resize',
                scheduleHeightUpdate,
            );
            window.removeEventListener('resize', scheduleHeightUpdate);
            if (pendingFrame !== undefined) cancelAnimationFrame(pendingFrame);
        };
    }, []);
    return pageRef;
}
