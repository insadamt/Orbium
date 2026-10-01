import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    horizontalListSortingStrategy,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Database,
    FileText,
    Folder,
    GripVertical,
    Home,
    Pin,
    Settings2,
    X,
} from 'lucide-react';
import { useNavigation, type Tab } from './navigation-store';
import { activateTab, closeTab } from './tab-navigation';

const tabIcons = {
    document: FileText,
    database: Database,
    settings: Settings2,
    workspace: Home,
};

function SortableTab({
    tab,
    selected,
    floating,
    tabCount,
}: {
    tab: Tab;
    selected: boolean;
    floating: boolean;
    tabCount: number;
}) {
    const entry = tab.entries[tab.index];
    const Icon = entry.url.includes('/nodes/') ? Folder : tabIcons[entry.kind];
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: tab.id });
    const icon = entry.iconUrl ? (
        <img
            src={entry.iconUrl}
            alt=""
            className="size-4 shrink-0 rounded-sm object-cover"
        />
    ) : entry.icon ? (
        <span aria-hidden="true" className="shrink-0 text-base leading-none">
            {entry.icon}
        </span>
    ) : (
        <Icon size={15} className="shrink-0" aria-hidden="true" />
    );

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            data-dragging={isDragging}
            data-pinned={Boolean(tab.pinned)}
            className={`${floating ? 'floating-tab' : 'my-1.5 flex max-w-52 min-w-28 shrink-0 items-center rounded-lg'} ${selected ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/60'}`}
        >
            <button
                ref={setActivatorNodeRef}
                type="button"
                aria-label={`Reorder ${entry.title} tab`}
                title="Drag to reorder tab"
                className="tab-drag-handle shrink-0 rounded-md p-1 focus-visible:outline-2 focus-visible:outline-ring"
                {...attributes}
                {...listeners}
            >
                <GripVertical size={13} aria-hidden="true" />
            </button>
            <button
                type="button"
                role="tab"
                aria-selected={selected}
                title={entry.title}
                onClick={() => activateTab(tab.id)}
                className="flex min-w-0 flex-1 items-center gap-2 py-2 pr-1 text-left text-sm focus-visible:outline-2 focus-visible:outline-ring"
            >
                {icon}
                <span className="truncate">{entry.title}</span>
            </button>
            <button
                type="button"
                aria-label={`${tab.pinned ? 'Unpin' : 'Pin'} ${entry.title} tab`}
                title={tab.pinned ? 'Unpin tab' : 'Pin tab'}
                aria-pressed={Boolean(tab.pinned)}
                onClick={() =>
                    useNavigation.getState().setPinned(tab.id, !tab.pinned)
                }
                className="tab-pin-button rounded-md p-1 text-muted-foreground hover:bg-background hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
                <Pin size={13} fill={tab.pinned ? 'currentColor' : 'none'} />
            </button>
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
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    function reorderTabs({ active, over }: DragEndEvent) {
        if (over && active.id !== over.id)
            useNavigation
                .getState()
                .moveTab(String(active.id), String(over.id));
    }

    return (
        <nav
            aria-label="Workspace tabs"
            className={floating ? 'floating-tabs' : 'h-full min-w-0 flex-1'}
        >
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={reorderTabs}
            >
                <SortableContext
                    items={tabs.map((tab) => tab.id)}
                    strategy={horizontalListSortingStrategy}
                >
                    <div
                        role="tablist"
                        aria-label="Workspace tabs"
                        className={
                            floating
                                ? 'floating-tab-list'
                                : 'flex h-full min-w-0 items-stretch gap-1 overflow-x-auto px-2'
                        }
                    >
                        {tabs.map((tab) => (
                            <SortableTab
                                key={tab.id}
                                tab={tab}
                                selected={tab.id === activeId}
                                floating={floating}
                                tabCount={tabs.length}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </nav>
    );
}
