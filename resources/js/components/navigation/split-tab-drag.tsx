import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePage } from '@inertiajs/react';
import { prepareTabForSplit } from './split-tab-preparation';
import { useNavigation, type SplitTabs, type Tab } from './navigation-store';
import { hasRetainedDocument } from './tab-page-cache';
import { groupForTab } from './split-group-state';
import { canSplitTabs } from './split-tab-rules';

export function useSplitTabDrag(
    draggedTab: Tab | null,
    tabs: Tab[],
    activeId: string,
    splitGroups: SplitTabs[],
) {
    const { version } = usePage();
    const [preparingDropTitle, setPreparingDropTitle] = useState<string | null>(
        null,
    );
    const [edge, setEdge] = useState<'left' | 'right' | null>(null);
    const activeTab = tabs.find((tab) => tab.id === activeId);
    const eligible = Boolean(
        draggedTab &&
        draggedTab.id !== activeId &&
        !groupForTab(splitGroups, draggedTab.id) &&
        !groupForTab(splitGroups, activeId) &&
        canSplitTabs(draggedTab, activeTab),
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

    function prepareHeldTab(tab: Tab) {
        if (
            tab.id === activeId ||
            groupForTab(splitGroups, tab.id) ||
            groupForTab(splitGroups, activeId)
        )
            return Promise.resolve(false);
        const companion = activeTab;
        if (!canSplitTabs(tab, companion)) return Promise.resolve(false);
        return Promise.all([
            prepareTabForSplit(tab, version),
            companion
                ? prepareTabForSplit(companion, version)
                : Promise.resolve(false),
        ]).then((prepared) => prepared.every(Boolean));
    }

    async function splitPreparedTab(tab: Tab, placement: 'left' | 'right') {
        const previous = useNavigation.getState();
        if (tab.id === previous.activeId) return;
        const companion = previous.tabs.find(
            (item) => item.id === previous.activeId,
        );
        const companionUrl = companion?.entries[companion.index].url;
        if (
            !hasRetainedDocument(tab.id) &&
            tab.entries[tab.index].kind === 'document'
        )
            setPreparingDropTitle(tab.entries[tab.index].title);
        try {
            await prepareHeldTab(tab);
            const current = useNavigation.getState();
            const currentCompanion = current.tabs.find(
                (item) => item.id === current.activeId,
            );
            if (
                current.activeId === previous.activeId &&
                currentCompanion?.entries[currentCompanion.index].url ===
                    companionUrl
            )
                current.splitTab(tab.id, placement);
        } finally {
            setPreparingDropTitle(null);
        }
    }

    return {
        edge,
        eligible,
        prepareHeldTab,
        splitPreparedTab,
        preparingDropTitle,
        clearEdge: () => setEdge(null),
    };
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
