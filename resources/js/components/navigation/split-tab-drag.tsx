import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { SplitTabs, Tab } from './navigation-store';
import { groupForTab } from './split-group-state';
import { canSplitTabs } from './split-tab-rules';

export function useSplitTabDrag(
    draggedTab: Tab | null,
    tabs: Tab[],
    activeId: string,
    splitGroups: SplitTabs[],
) {
    const [edge, setEdge] = useState<'left' | 'right' | null>(null);
    const activeTab = tabs.find((tab) => tab.id === activeId);
    const eligible = Boolean(
        draggedTab &&
        !groupForTab(splitGroups, draggedTab.id) &&
        !groupForTab(splitGroups, activeId) &&
        (draggedTab.id === activeId
            ? tabs.some(
                  (tab) =>
                      !groupForTab(splitGroups, tab.id) &&
                      canSplitTabs(draggedTab, tab),
              )
            : canSplitTabs(draggedTab, activeTab)),
    );

    useEffect(() => {
        if (!eligible) return;
        const detectEdge = (clientX: number) => {
            setEdge(
                clientX <= 88
                    ? 'left'
                    : clientX >= window.innerWidth - 88
                      ? 'right'
                      : null,
            );
        };
        const onMouseMove = (event: MouseEvent) => detectEdge(event.clientX);
        const onTouchMove = (event: TouchEvent) => {
            const touch = event.touches[0];
            if (touch) detectEdge(touch.clientX);
        };
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('touchmove', onTouchMove, { passive: true });
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('touchmove', onTouchMove);
        };
    }, [eligible]);

    return { edge, eligible, clearEdge: () => setEdge(null) };
}

export function SplitEdgePreview({
    edge,
    portalHost,
}: {
    edge: 'left' | 'right' | null;
    portalHost: HTMLElement;
}) {
    return createPortal(
        <div className="split-edge-zones" aria-hidden="true">
            <div
                className={`split-edge-zone ${edge === 'left' ? 'is-active' : ''}`}
            >
                <span>Place on left</span>
            </div>
            <div
                className={`split-edge-zone ${edge === 'right' ? 'is-active' : ''}`}
            >
                <span>Place on right</span>
            </div>
        </div>,
        portalHost,
    );
}
