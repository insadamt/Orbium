import {
    closestCenter,
    DndContext,
    DragOverlay,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
    type Modifier,
} from '@dnd-kit/core';
import {
    horizontalListSortingStrategy,
    SortableContext,
    sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Pin, X } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
    NavigationTabContextMenu,
    type TabMenuPosition,
} from './navigation-tab-context-menu';
import { useNavigation, type Tab } from './navigation-store';
import { groupForTab } from './split-group-state';
import { NavigationTabIcon } from './navigation-tab-icon';
import { SplitEdgePreview, useSplitTabDrag } from './split-tab-drag';
import { SplitNavigationTab } from './split-navigation-tab';
import { SortableNavigationTab } from './sortable-navigation-tab';
import { useNavigationTabPresence } from './use-navigation-tab-presence';
import { useNavigationTabLayoutMotion } from './use-navigation-tab-layout-motion';

const keepTabDragInsideStrip: Modifier = ({
    transform,
    draggingNodeRect,
    scrollableAncestorRects,
    windowRect,
}) => {
    const stripBounds = scrollableAncestorRects[0] ?? windowRect;
    if (!draggingNodeRect || !stripBounds)
        return { ...transform, y: 0, scaleX: 1, scaleY: 1 };

    const minX = stripBounds.left - draggingNodeRect.left;
    const maxX = stripBounds.right - draggingNodeRect.right;
    return {
        ...transform,
        x: minX > maxX ? 0 : Math.max(minX, Math.min(transform.x, maxX)),
        y: 0,
        scaleX: 1,
        scaleY: 1,
    };
};

export function NavigationTabStrip({
    floating = false,
}: {
    floating?: boolean;
}) {
    const tabs = useNavigation((state) => state.tabs);
    const activeId = useNavigation((state) => state.activeId);
    const splitGroups = useNavigation((state) => state.splitGroups);
    const [menuPosition, setMenuPosition] = useState<TabMenuPosition | null>(
        null,
    );
    const [draggedTab, setDraggedTab] = useState<Tab | null>(null);
    const [dragPreviewWidth, setDragPreviewWidth] = useState<number>();
    const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const tabListRef = useRef<HTMLDivElement>(null);
    const {
        edge: splitEdge,
        eligible: draggedCanSplit,
        clearEdge,
        prepareHeldTab,
        splitPreparedTab,
        preparingDropTitle,
    } = useSplitTabDrag(draggedTab, tabs, activeId, splitGroups);
    const renderedTabs = useNavigationTabPresence(tabs, splitGroups);
    const displayedTabs = renderedTabs.filter((item) => !item.exiting);
    const draggedGroup = draggedTab
        ? groupForTab(splitGroups, draggedTab.id)
        : undefined;
    const dragPreviewTabs = draggedGroup
        ? [draggedGroup.leftId, draggedGroup.rightId]
              .map((id) => tabs.find((tab) => tab.id === id))
              .filter((tab): tab is Tab => Boolean(tab))
        : draggedTab
          ? [draggedTab]
          : [];
    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 180, tolerance: 8 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    useEffect(() => setPortalHost(document.body), []);

    useEffect(() => {
        const tabList = tabListRef.current;
        if (!tabList) return;
        const updateScrollEdges = () => {
            const lastScrollPosition =
                tabList.scrollWidth - tabList.clientWidth;
            setCanScrollLeft(tabList.scrollLeft > 1);
            setCanScrollRight(tabList.scrollLeft < lastScrollPosition - 1);
        };
        const resizeObserver = new ResizeObserver(updateScrollEdges);
        resizeObserver.observe(tabList);
        tabList.addEventListener('scroll', updateScrollEdges, {
            passive: true,
        });
        updateScrollEdges();
        return () => {
            resizeObserver.disconnect();
            tabList.removeEventListener('scroll', updateScrollEdges);
        };
    }, [tabs, renderedTabs]);

    useLayoutEffect(() => {
        const tabList = tabListRef.current;
        const activeTab = Array.from(tabList?.children ?? []).find(
            (child) =>
                (child as HTMLElement).dataset.tabId === activeId ||
                (child as HTMLElement).dataset.splitTabIds
                    ?.split(' ')
                    .includes(activeId),
        );
        if (!tabList || !activeTab) return;
        const listBounds = tabList.getBoundingClientRect();
        const tabElement = activeTab as HTMLElement;
        const tabLeft = tabElement.offsetLeft - tabList.offsetLeft;
        if (tabLeft < tabList.scrollLeft) tabList.scrollLeft = tabLeft;
        else if (
            tabLeft + tabElement.offsetWidth >
            tabList.scrollLeft + listBounds.width
        )
            tabList.scrollLeft =
                tabLeft + tabElement.offsetWidth - listBounds.width;
    }, [activeId]);

    useNavigationTabLayoutMotion(tabListRef, Boolean(draggedTab));

    async function reorderTabs({ active, over }: DragEndEvent) {
        setDraggedTab(null);
        clearEdge();
        if (splitEdge) {
            const tab = tabs.find((item) => item.id === String(active.id));
            if (tab) await splitPreparedTab(tab, splitEdge);
            return;
        }
        if (over && active.id !== over.id)
            useNavigation
                .getState()
                .moveTab(String(active.id), String(over.id));
    }

    function scrollTabs(direction: -1 | 1) {
        const tabList = tabListRef.current;
        if (!tabList) return;
        tabList.scrollBy({
            left: direction * Math.max(160, tabList.clientWidth * 0.7),
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)')
                .matches
                ? 'auto'
                : 'smooth',
        });
    }

    return (
        <nav
            onPointerDownCapture={(event) => {
                const element =
                    event.target instanceof Element
                        ? event.target
                              .closest('.tab-drag-surface')
                              ?.closest<HTMLElement>('[data-tab-id]')
                        : null;
                const tab = tabs.find(
                    (item) => item.id === element?.dataset.tabId,
                );
                if (tab) void prepareHeldTab(tab);
            }}
            aria-label="Workspace tabs"
            className={
                floating ? 'floating-tabs' : 'relative h-full min-w-0 flex-1'
            }
        >
            {preparingDropTitle && (
                <span className="split-preparing-status" role="status">
                    Opening {preparingDropTitle}…
                </span>
            )}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                autoScroll={{
                    canScroll: (element) => element === tabListRef.current,
                    acceleration: 12,
                    interval: 16,
                }}
                modifiers={draggedCanSplit ? [] : [keepTabDragInsideStrip]}
                onDragStart={({ active }) => {
                    const tab = tabs.find((item) => item.id === active.id);
                    if (tab) {
                        const tabElement = Array.from(
                            tabListRef.current?.children ?? [],
                        ).find((child) => {
                            const element = child as HTMLElement;
                            return (
                                element.dataset.tabId === tab.id ||
                                element.dataset.splitTabIds
                                    ?.split(' ')
                                    .includes(tab.id)
                            );
                        });
                        setDragPreviewWidth(
                            tabElement?.getBoundingClientRect().width ??
                                active.rect.current.initial?.width,
                        );
                        void prepareHeldTab(tab);
                        setDraggedTab(tab);
                    }
                }}
                onDragEnd={reorderTabs}
                onDragCancel={() => {
                    setDraggedTab(null);
                    clearEdge();
                }}
            >
                <SortableContext
                    items={displayedTabs.map((item) => item.tab.id)}
                    strategy={horizontalListSortingStrategy}
                >
                    <div
                        ref={tabListRef}
                        role="tablist"
                        aria-label="Workspace tabs"
                        className={
                            floating
                                ? 'floating-tab-list tab-scroll-list'
                                : 'tab-scroll-list flex h-full min-w-0 items-stretch gap-1 overflow-x-auto px-2'
                        }
                    >
                        {renderedTabs.map(
                            ({ key, tab, left, right, exiting }) =>
                                left && right ? (
                                    <SplitNavigationTab
                                        key={key}
                                        left={left}
                                        right={right}
                                        sortId={tab.id}
                                        activeId={activeId}
                                        floating={floating}
                                        exiting={exiting}
                                    />
                                ) : (
                                    <SortableNavigationTab
                                        key={key}
                                        tab={tab}
                                        selected={tab.id === activeId}
                                        floating={floating}
                                        tabCount={tabs.length}
                                        onOpenMenu={setMenuPosition}
                                        exiting={exiting}
                                    />
                                ),
                        )}
                    </div>
                </SortableContext>
                {portalHost &&
                    createPortal(
                        <DragOverlay
                            dropAnimation={null}
                            modifiers={
                                draggedCanSplit ? [] : [keepTabDragInsideStrip]
                            }
                            style={{
                                width: dragPreviewWidth,
                                minWidth: dragPreviewWidth,
                                maxWidth: dragPreviewWidth,
                            }}
                            zIndex={80}
                        >
                            {draggedTab && (
                                <div
                                    className={`floating-tab-drag-preview ${draggedGroup ? 'is-split' : ''} ${draggedTab.id === activeId || (draggedGroup && [draggedGroup.leftId, draggedGroup.rightId].includes(activeId)) ? 'bg-accent text-foreground' : 'text-muted-foreground'}`}
                                >
                                    {dragPreviewTabs.map((tab) => (
                                        <span
                                            key={tab.id}
                                            className="flex min-w-0 flex-1 items-center gap-2 py-2 pr-1 pl-3 text-left text-xs"
                                        >
                                            <NavigationTabIcon
                                                entry={tab.entries[tab.index]}
                                            />
                                            <span className="truncate">
                                                {tab.entries[tab.index].title}
                                            </span>
                                        </span>
                                    ))}
                                    {draggedGroup ? null : draggedTab.pinned ? (
                                        <Pin
                                            size={12}
                                            fill="currentColor"
                                            className="mr-2 shrink-0 text-muted-foreground"
                                        />
                                    ) : (
                                        <span
                                            className={`mr-1 rounded-md p-1 text-muted-foreground ${tabs.length === 1 ? 'invisible' : ''}`}
                                        >
                                            <X size={13} />
                                        </span>
                                    )}
                                </div>
                            )}
                        </DragOverlay>,
                        portalHost,
                    )}
            </DndContext>
            {draggedCanSplit && portalHost && (
                <SplitEdgePreview edge={splitEdge} portalHost={portalHost} />
            )}
            {canScrollLeft && (
                <button
                    type="button"
                    aria-label="Scroll tabs left"
                    title="Scroll tabs left"
                    className="tab-scroll-button tab-scroll-button-left"
                    onClick={() => scrollTabs(-1)}
                >
                    <ChevronLeft size={15} aria-hidden="true" />
                </button>
            )}
            {canScrollRight && (
                <button
                    type="button"
                    aria-label="Scroll tabs right"
                    title="Scroll tabs right"
                    className="tab-scroll-button tab-scroll-button-right"
                    onClick={() => scrollTabs(1)}
                >
                    <ChevronRight size={15} aria-hidden="true" />
                </button>
            )}
            <NavigationTabContextMenu
                position={menuPosition}
                onClose={() => setMenuPosition(null)}
                onTogglePin={(tabId, pinned) =>
                    useNavigation.getState().setPinned(tabId, pinned)
                }
            />
        </nav>
    );
}
