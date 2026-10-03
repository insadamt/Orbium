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
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Pin, X } from 'lucide-react';
import {
    useEffect,
    useRef,
    useState,
    type KeyboardEvent,
    type MouseEvent,
} from 'react';
import {
    NavigationTabContextMenu,
    type TabMenuPosition,
} from './navigation-tab-context-menu';
import { useNavigation, type Tab } from './navigation-store';
import { groupForTab } from './split-group-state';
import { NavigationTabIcon } from './navigation-tab-icon';
import { SplitEdgePreview, useSplitTabDrag } from './split-tab-drag';
import { SplitNavigationTab } from './split-navigation-tab';
import { activateTab, closeTab } from './tab-navigation';

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
function SortableTab({
    tab,
    selected,
    floating,
    tabCount,
    onOpenMenu,
}: {
    tab: Tab;
    selected: boolean;
    floating: boolean;
    tabCount: number;
    onOpenMenu: (position: TabMenuPosition) => void;
}) {
    const entry = tab.entries[tab.index];
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: tab.id });
    return (
        <div
            ref={setNodeRef}
            style={{
                transform: isDragging
                    ? undefined
                    : CSS.Transform.toString(transform),
                transition,
                opacity: isDragging ? 0 : undefined,
            }}
            data-dragging={isDragging}
            data-pinned={Boolean(tab.pinned)}
            data-tab-id={tab.id}
            className={`${floating ? 'floating-tab' : 'my-1.5 flex max-w-52 min-w-28 shrink-0 items-center rounded-lg'} ${selected ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/60'}`}
            onContextMenu={(event: MouseEvent<HTMLDivElement>) => {
                event.preventDefault();
                onOpenMenu({
                    tabId: tab.id,
                    title: entry.title,
                    pinned: Boolean(tab.pinned),
                    x: event.clientX,
                    y: event.clientY,
                    direction: getComputedStyle(event.currentTarget)
                        .direction as 'ltr' | 'rtl',
                });
            }}
            onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
                if (event.shiftKey && event.key === 'F10') {
                    event.preventDefault();
                    const bounds = event.currentTarget.getBoundingClientRect();
                    onOpenMenu({
                        tabId: tab.id,
                        title: entry.title,
                        pinned: Boolean(tab.pinned),
                        x:
                            getComputedStyle(event.currentTarget).direction ===
                            'rtl'
                                ? bounds.right
                                : bounds.left,
                        y: bounds.bottom,
                        direction: getComputedStyle(event.currentTarget)
                            .direction as 'ltr' | 'rtl',
                    });
                }
            }}
        >
            <button
                id={`tab-${tab.id}`}
                ref={setActivatorNodeRef}
                type="button"
                {...attributes}
                {...listeners}
                role="tab"
                aria-selected={selected}
                title={entry.title}
                onClick={() => activateTab(tab.id)}
                className="tab-drag-surface flex min-w-0 flex-1 items-center gap-2 py-2 pr-1 pl-3 text-left text-sm focus-visible:outline-2 focus-visible:outline-ring"
            >
                <NavigationTabIcon entry={entry} />
                <span className="truncate">{entry.title}</span>
            </button>
            {tab.pinned && (
                <Pin
                    size={12}
                    fill="currentColor"
                    className="mr-2 shrink-0 text-muted-foreground"
                    aria-label="Pinned tab"
                />
            )}
            {tabCount > 1 && !tab.pinned && (
                <button
                    type="button"
                    aria-label={`Close ${entry.title}`}
                    onClick={() => closeTab(tab.id)}
                    className="mr-1 rounded-md p-1 text-muted-foreground hover:bg-background hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <X size={13} aria-hidden="true" />
                </button>
            )}
        </div>
    );
}

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
    } = useSplitTabDrag(draggedTab, tabs, activeId, splitGroups);
    const firstSplitTabIds = new Set(
        splitGroups.flatMap((group) => {
            const firstTab = tabs.find(
                (tab) => tab.id === group.leftId || tab.id === group.rightId,
            );
            return firstTab ? [firstTab.id] : [];
        }),
    );
    const displayedTabs = tabs.filter(
        (tab) =>
            !groupForTab(splitGroups, tab.id) || firstSplitTabIds.has(tab.id),
    );
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
    }, [tabs]);

    useEffect(() => {
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
        const tabBounds = activeTab.getBoundingClientRect();
        if (tabBounds.left < listBounds.left)
            tabList.scrollLeft += tabBounds.left - listBounds.left;
        else if (tabBounds.right > listBounds.right)
            tabList.scrollLeft += tabBounds.right - listBounds.right;
    }, [activeId]);

    function reorderTabs({ active, over }: DragEndEvent) {
        setDraggedTab(null);
        clearEdge();
        if (splitEdge) {
            useNavigation.getState().splitTab(String(active.id), splitEdge);
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
            aria-label="Workspace tabs"
            className={
                floating ? 'floating-tabs' : 'relative h-full min-w-0 flex-1'
            }
        >
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
                    items={displayedTabs.map((tab) => tab.id)}
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
                        {displayedTabs.map((tab) => {
                            const group = groupForTab(splitGroups, tab.id);
                            if (group) {
                                const left = tabs.find(
                                    (item) => item.id === group.leftId,
                                );
                                const right = tabs.find(
                                    (item) => item.id === group.rightId,
                                );
                                return left && right ? (
                                    <SplitNavigationTab
                                        key={`split-${left.id}-${right.id}`}
                                        left={left}
                                        right={right}
                                        sortId={tab.id}
                                        activeId={activeId}
                                        floating={floating}
                                    />
                                ) : null;
                            }
                            return (
                                <SortableTab
                                    key={tab.id}
                                    tab={tab}
                                    selected={tab.id === activeId}
                                    floating={floating}
                                    tabCount={tabs.length}
                                    onOpenMenu={setMenuPosition}
                                />
                            );
                        })}
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
                                        tabs.length > 1 && (
                                            <span className="mr-1 rounded-md p-1 text-muted-foreground">
                                                <X size={13} />
                                            </span>
                                        )
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
