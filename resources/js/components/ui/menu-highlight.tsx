import { useLayoutEffect, useRef } from 'react';
import { mountMenuHighlight } from '@/lib/menu-highlight';

export function MenuHighlight() {
    const marker = useRef<HTMLSpanElement>(null);
    useLayoutEffect(() => {
        const surface = marker.current?.parentElement;
        if (surface) return mountMenuHighlight(surface);
    }, []);
    return <span ref={marker} hidden aria-hidden="true" />;
}
