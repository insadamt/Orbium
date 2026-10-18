import { useLayoutEffect, type RefObject } from 'react';
import { attachWorkspaceWheelScrolling } from './split-pane-scroll';

export function useSplitWorkspaceScroll(
    workspaceRef: RefObject<HTMLDivElement | null>,
    active: boolean,
) {
    useLayoutEffect(() => {
        const workspace = workspaceRef.current;
        if (!workspace || !active) return;
        let previousOffset = 0;
        const updateViewportOffset = () => {
            const motionOffset =
                Number.parseFloat(getComputedStyle(workspace).top) || 0;
            const offset =
                workspace.getBoundingClientRect().top +
                window.scrollY +
                previousOffset -
                motionOffset;
            previousOffset = offset;
            workspace.style.setProperty(
                '--split-workspace-offset',
                `${offset}px`,
            );
        };

        // The scrollport reaches the viewport edges; the document's own margin supplies the opening gap.

        updateViewportOffset();
        window.scrollTo(0, 0);
        const observer = new ResizeObserver(updateViewportOffset);
        observer.observe(workspace);
        if (workspace.parentElement) observer.observe(workspace.parentElement);
        window.addEventListener('resize', updateViewportOffset);
        const detachWheel = attachWorkspaceWheelScrolling(workspace);
        return () => {
            observer.disconnect();
            detachWheel();
            window.removeEventListener('resize', updateViewportOffset);
            workspace.style.removeProperty('--split-workspace-offset');
        };
    }, [workspaceRef, active]);
}
