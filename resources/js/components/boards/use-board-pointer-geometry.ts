import { useCallback, useLayoutEffect, useRef, type RefObject } from 'react';
import type { BoardPoint } from './board-types';

export function useBoardPointerGeometry(
    viewportRef: RefObject<HTMLDivElement | null>,
) {
    const origin = useRef<{ left: number; top: number } | null>(null);
    useLayoutEffect(() => {
        const invalidateOrigin = () => {
            origin.current = null;
        };
        const observer = new ResizeObserver(invalidateOrigin);
        if (viewportRef.current) observer.observe(viewportRef.current);
        window.addEventListener('resize', invalidateOrigin);
        window.addEventListener('scroll', invalidateOrigin, true);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', invalidateOrigin);
            window.removeEventListener('scroll', invalidateOrigin, true);
            invalidateOrigin();
        };
    }, [viewportRef]);

    return useCallback(
        (point: BoardPoint, refresh = false): BoardPoint => {
            //
            // Gesture painting changes styles each frame; reuse the viewport origin until scrolling/resizing can actually move it.
            //
            if (refresh || !origin.current) {
                const bounds = viewportRef.current?.getBoundingClientRect();
                origin.current = {
                    left: bounds?.left ?? 0,
                    top: bounds?.top ?? 0,
                };
            }
            return {
                x: point.x - origin.current.left,
                y: point.y - origin.current.top,
            };
        },
        [viewportRef],
    );
}
