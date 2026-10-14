import { useLayoutEffect, useRef, type RefObject } from 'react';

type TabContentSurface = {
    key: string;
    tabIds: string[];
    tabIndex: number;
};

type TabContentMotionOptions = {
    workspaceRef: RefObject<HTMLDivElement | null>;
    surface: TabContentSurface | null;
};

export function useTabContentMotion({
    workspaceRef,
    surface,
}: TabContentMotionOptions) {
    const previousSurface = useRef<TabContentSurface | null>(null);

    useLayoutEffect(() => {
        if (!surface) return;
        const previous = previousSurface.current;
        previousSurface.current = surface;

        const workspace = workspaceRef.current;
        if (
            !workspace ||
            !previous ||
            previous.key === surface.key ||
            previous.tabIds.some((tabId) => surface.tabIds.includes(tabId))
        )
            return;

        const reducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        );
        if (reducedMotion.matches) return;

        const direction = surface.tabIndex < previous.tabIndex ? -1 : 1;
        // A positional offset preserves viewport anchoring for fixed editor controls.
        const animation = workspace.animate(
            [{ left: `${direction * 14}px` }, { left: '0px' }],
            { duration: 280, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
        );
        const cancelForReducedMotion = () => {
            if (reducedMotion.matches) animation.cancel();
        };
        reducedMotion.addEventListener('change', cancelForReducedMotion);

        return () => {
            animation.cancel();
            reducedMotion.removeEventListener('change', cancelForReducedMotion);
        };
    }, [workspaceRef, surface]);
}
