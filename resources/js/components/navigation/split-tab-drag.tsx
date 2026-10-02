import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Tab } from './navigation-store';
import { canSplitTabs } from './split-tab-rules';

export function useSplitTabDrag(
    draggedTab: Tab | null,
    tabs: Tab[],
    activeId: string,
) {
    const [edge, setEdge] = useState<'left' | 'right' | null>(null);
    const activeTab = tabs.find((tab) => tab.id === activeId);
    const eligible = Boolean(
        draggedTab &&
        (draggedTab.id === activeId
            ? tabs.some((tab) => canSplitTabs(draggedTab, tab))
            : canSplitTabs(draggedTab, activeTab)),
    );

    useEffect(() => {
        if (!eligible) return;
        const detectEdge = (clientX: number) => {
            setEdge(
                clientX <= 72
                    ? 'left'
                    : clientX >= window.innerWidth - 72
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
                <span>Release to split left</span>
            </div>
            <div
                className={`split-edge-zone ${edge === 'right' ? 'is-active' : ''}`}
            >
                <span>Release to split right</span>
            </div>
        </div>,
        portalHost,
    );
}
