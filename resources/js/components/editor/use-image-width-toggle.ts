import { useLayoutEffect, useState, type RefObject } from 'react';
import {
    imageWidthTogglePresentation,
    nextImageToggleWidth,
} from './image-width-toggle';

export function useImageWidthToggle({
    containerRef,
    width,
    onResize,
}: {
    containerRef: RefObject<HTMLDivElement | null>;
    width: number;
    onResize: (width: number) => void;
}) {
    const [availableWidth, setAvailableWidth] = useState(0);
    const [previousWidth, setPreviousWidth] = useState<number>();
    useLayoutEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const update = () => setAvailableWidth(container.clientWidth);
        const observer = new ResizeObserver(update);
        observer.observe(container);
        update();
        return () => observer.disconnect();
    }, [containerRef]);
    const state = { width, availableWidth, previousWidth };
    return {
        ...imageWidthTogglePresentation(state),
        toggle: () => {
            if (!availableWidth) return;
            const next = nextImageToggleWidth(state);
            setPreviousWidth(next.previousWidth);
            onResize(next.width);
        },
    };
}
