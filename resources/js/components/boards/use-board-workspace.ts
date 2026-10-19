import { useLayoutEffect, useRef } from 'react';

export function useBoardWorkspace() {
    const pageRef = useRef<HTMLDivElement>(null);
    useLayoutEffect(() => {
        const shell = pageRef.current?.closest('.orbium-shell');
        const controls = [
            ...(shell?.querySelectorAll<HTMLElement>(
                '.floating-top-controls, .embedded-pane-actions',
            ) ?? []),
        ].map((element) => ({ element, wasInert: element.inert }));

        //
        // The Board owns the viewport, so hidden application controls must also leave keyboard navigation until it unmounts.
        //
        for (const { element } of controls) element.inert = true;
        const updateViewportHeight = () => {
            const height = window.visualViewport?.height ?? window.innerHeight;
            pageRef.current?.style.setProperty(
                '--board-viewport-height',
                `${height}px`,
            );
        };
        updateViewportHeight();
        window.visualViewport?.addEventListener('resize', updateViewportHeight);
        window.addEventListener('resize', updateViewportHeight);
        return () => {
            window.visualViewport?.removeEventListener(
                'resize',
                updateViewportHeight,
            );
            window.removeEventListener('resize', updateViewportHeight);
            for (const { element, wasInert } of controls)
                element.inert = wasInert;
        };
    }, []);
    return pageRef;
}
