import { Database, FileText, Home, Folder, Settings2, X } from 'lucide-react';
import { useNavigation } from './navigation-store';
import { activateTab, closeTab } from './tab-navigation';

const tabIcons = {
    document: FileText,
    database: Database,
    settings: Settings2,
    workspace: Home,
};

export function NavigationTabStrip({
    floating = false,
}: {
    floating?: boolean;
}) {
    const tabs = useNavigation((state) => state.tabs);
    const activeId = useNavigation((state) => state.activeId);

    return (
        <nav
            aria-label="Workspace tabs"
            className={floating ? 'floating-tabs' : 'h-full min-w-0 flex-1'}
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
                {tabs.map((tab) => {
                    const entry = tab.entries[tab.index];
                    const Icon = entry.url.includes('/nodes/')
                        ? Folder
                        : tabIcons[entry.kind];
                    const selected = tab.id === activeId;
                    return (
                        <div
                            key={tab.id}
                            className={`${floating ? 'floating-tab' : 'my-1.5 flex max-w-52 min-w-28 shrink-0 items-center rounded-lg'} ${selected ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/60'}`}
                        >
                            <button
                                type="button"
                                role="tab"
                                aria-selected={selected}
                                title={entry.title}
                                onClick={() => activateTab(tab.id)}
                                className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left text-sm focus-visible:outline-2 focus-visible:outline-ring"
                            >
                                <Icon
                                    size={15}
                                    className="shrink-0"
                                    aria-hidden="true"
                                />
                                <span className="truncate">{entry.title}</span>
                            </button>
                            {tabs.length > 1 && (
                                <button
                                    type="button"
                                    aria-label={`Close ${entry.title}`}
                                    onClick={() => closeTab(tab.id)}
                                    className="mr-1 rounded-md p-1 text-muted-foreground hover:bg-background hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <X size={13} />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </nav>
    );
}
