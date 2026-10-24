import { useEffect, useRef, type RefObject } from 'react';

export function useBoardPanShortcut(
    viewportRef: RefObject<HTMLDivElement | null>,
    cancel: () => unknown,
    clearTouches: () => void,
) {
    const space = useRef(false);
    useEffect(() => {
        const keydown = (event: KeyboardEvent) => {
            if (
                event.key !== ' ' ||
                event.ctrlKey ||
                event.metaKey ||
                (event.target instanceof Element &&
                    event.target.closest(
                        'input, textarea, [contenteditable="true"]',
                    ))
            )
                return;
            if (!viewportRef.current?.contains(document.activeElement)) return;
            event.preventDefault();
            space.current = true;
            viewportRef.current.dataset.space = 'true';
        };
        const resetSpace = () => {
            space.current = false;
            if (viewportRef.current)
                viewportRef.current.dataset.space = 'false';
        };
        const keyup = (event: KeyboardEvent) => {
            if (event.key === ' ') resetSpace();
        };
        const blur = () => {
            resetSpace();
            cancel();
            clearTouches();
        };
        window.addEventListener('keydown', keydown);
        window.addEventListener('keyup', keyup);
        window.addEventListener('blur', blur);
        return () => {
            blur();
            window.removeEventListener('keydown', keydown);
            window.removeEventListener('keyup', keyup);
            window.removeEventListener('blur', blur);
        };
    }, [cancel, viewportRef, clearTouches]);

    return space;
}
