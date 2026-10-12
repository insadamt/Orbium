import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Pin, X } from 'lucide-react';
import type { KeyboardEvent, MouseEvent } from 'react';
import type { TabMenuPosition } from './navigation-tab-context-menu';
import type { Tab } from './navigation-store';
import { NavigationTabIcon } from './navigation-tab-icon';
import { activateTab, closeTab } from './tab-navigation';

export function SortableNavigationTab({
    tab,
    selected,
    floating,
    tabCount,
    onOpenMenu,
    exiting,
}: {
    tab: Tab;
    selected: boolean;
    floating: boolean;
    tabCount: number;
    exiting: boolean;
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
    } = useSortable({
        id: exiting ? `exiting-${tab.id}` : tab.id,
        disabled: exiting,
    });
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
            inert={exiting}
            aria-hidden={exiting || undefined}
            data-tab-exiting={exiting}
            data-dragging={isDragging}
            data-pinned={Boolean(tab.pinned)}
            data-tab-id={exiting ? undefined : tab.id}
            className={`navigation-tab-motion ${floating ? 'floating-tab' : 'my-1.5 flex max-w-52 min-w-28 shrink-0 items-center rounded-lg'} ${selected ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/60'}`}
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
                id={exiting ? undefined : `tab-${tab.id}`}
                ref={setActivatorNodeRef}
                type="button"
                {...attributes}
                {...listeners}
                role="tab"
                aria-selected={selected}
                title={entry.title}
                onClick={() => activateTab(tab.id)}
                className="tab-drag-surface flex min-w-0 flex-1 items-center gap-2 py-2 pr-1 pl-3 text-left text-sm"
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
                    className="mr-1 rounded-md p-1 text-muted-foreground hover:bg-background hover:text-foreground"
                >
                    <X size={13} aria-hidden="true" />
                </button>
            )}
        </div>
    );
}
