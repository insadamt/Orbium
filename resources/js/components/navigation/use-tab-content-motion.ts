import { useLayoutEffect, useRef, type RefObject } from 'react';

type TabContentSurface = {
    key: string;
    pageKey: string;
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
        if (!workspace) return;

        const sharesVisibleTab = previous?.tabIds.some((tabId) =>
            surface.tabIds.includes(tabId),
        );
        // Split creation and removal already own their workspace choreography.
        if (previous && previous.key !== surface.key && sharesVisibleTab)
            return;

        const openingPage = !previous || previous.pageKey !== surface.pageKey;
        const switchingTabs =
            previous && previous.key !== surface.key && !sharesVisibleTab;
        if (!openingPage && !switchingTabs) return;

        const reducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        );
        if (reducedMotion.matches) return;

        const direction =
            previous && surface.tabIndex < previous.tabIndex ? -1 : 1;
        // A positional offset preserves viewport anchoring for fixed editor controls.
        const animation = workspace.animate(
            switchingTabs
                ? [{ left: `${direction * 14}px` }, { left: '0px' }]
                : [{ top: '18px' }, { top: '0px' }],
            {
                duration: switchingTabs ? 280 : 320,
                easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            },
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
