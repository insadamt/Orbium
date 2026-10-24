import { useLayoutEffect, useRef } from 'react';
import { mountMenuHighlight } from '@/lib/menu-highlight';

export function BoardToolbarHighlight() {
    const marker = useRef<HTMLSpanElement>(null);
    useLayoutEffect(() => {
        const toolbar = marker.current?.parentElement;
        if (!toolbar) return;
        //
        // Reuse Select's highlight without replaying an entrance on this persistent tool dock.
        //
        return mountMenuHighlight(toolbar, {
            itemSelector: '.board-tool-button',
            selectedSelector: ':focus-visible, [data-state="open"]',
            keepHighlightBetweenItems: true,
        });
    }, []);
    return <span ref={marker} hidden aria-hidden="true" />;
}
