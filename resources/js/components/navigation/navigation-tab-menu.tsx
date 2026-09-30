import {
    ArrowLeft,
    ArrowRight,
    ChevronDown,
    Database,
    FileText,
    Settings2,
    X,
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useNavigation } from './navigation-store';
import { activateTab, closeTab, stepHistory } from './tab-navigation';

type Props = {
    onRevealInNavigator?: () => void;
};

const tabIcons = {
    document: FileText,
    database: Database,
    settings: Settings2,
    workspace: Database,
};

export function NavigationTabMenu({ onRevealInNavigator }: Props) {
    const tabs = useNavigation((state) => state.tabs);
    const activeId = useNavigation((state) => state.activeId);
    const menu = useRef<HTMLDetailsElement>(null);
    const active = tabs.find((tab) => tab.id === activeId);
    const current = active?.entries[active.index];
    const ActiveIcon = current ? tabIcons[current.kind] : Database;

    useEffect(() => {
        function closeOnOutsideClick(event: PointerEvent) {
            if (!menu.current?.contains(event.target as Node))
                menu.current?.removeAttribute('open');
        }
        function closeOnEscape(event: KeyboardEvent) {
            if (event.key === 'Escape') menu.current?.removeAttribute('open');
        }
        document.addEventListener('pointerdown', closeOnOutsideClick);
        document.addEventListener('keydown', closeOnEscape);
        return () => {
            document.removeEventListener('pointerdown', closeOnOutsideClick);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, []);

    function closeMenu() {
        menu.current?.removeAttribute('open');
    }

    return (
        <details ref={menu} className="relative shrink-0">
            <summary className="flex max-w-40 cursor-pointer list-none items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                <ActiveIcon size={15} aria-hidden="true" />
                <ChevronDown size={13} aria-hidden="true" />
                <span className="sr-only">Open tabs and history</span>
            </summary>
            <div className="glass-surface absolute top-full right-0 z-30 mt-2 w-64 rounded-xl border border-border p-2 shadow-xl">
                <div className="flex gap-1 border-b border-border/70 pb-2">
                    <button
                        type="button"
                        aria-label="Back in tab"
                        disabled={!active || active.index === 0}
                        onClick={() => {
                            stepHistory(-1);
                            closeMenu();
                        }}
                        className="flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs hover:bg-accent disabled:opacity-30"
                    >
                        <ArrowLeft size={14} /> Back
                    </button>
                    <button
                        type="button"
                        aria-label="Forward in tab"
                        disabled={
                            !active || active.index >= active.entries.length - 1
                        }
                        onClick={() => {
                            stepHistory(1);
                            closeMenu();
                        }}
                        className="flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs hover:bg-accent disabled:opacity-30"
                    >
                        Forward <ArrowRight size={14} />
                    </button>
                </div>
                <div
                    role="tablist"
                    aria-label="Workspace tabs"
                    className="max-h-64 overflow-y-auto py-1"
                >
                    {tabs.map((tab) => {
                        const entry = tab.entries[tab.index];
                        const Icon = tabIcons[entry.kind];
                        return (
                            <div
                                key={tab.id}
                                className="flex items-center rounded-md hover:bg-accent"
                            >
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={tab.id === activeId}
                                    onClick={() => {
                                        activateTab(tab.id);
                                        closeMenu();
                                    }}
                                    className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-2 text-left text-sm"
                                >
                                    <Icon
                                        size={15}
                                        className="shrink-0 text-muted-foreground"
                                        aria-hidden="true"
                                    />
                                    <span className="truncate">
                                        {entry.title}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    aria-label={`Close ${entry.title}`}
                                    disabled={tabs.length < 2}
                                    onClick={() => closeTab(tab.id)}
                                    className="rounded-md p-1.5 text-muted-foreground hover:bg-background disabled:opacity-30"
                                >
                                    <X size={13} />
                                </button>
                            </div>
                        );
                    })}
                </div>
                {onRevealInNavigator && (
                    <div className="space-y-0.5 border-t border-border/70 pt-2 text-sm">
                        {onRevealInNavigator && (
                            <button
                                type="button"
                                onClick={() => {
                                    onRevealInNavigator();
                                    closeMenu();
                                }}
                                className="block w-full rounded-md px-2 py-2 text-left hover:bg-accent"
                            >
                                Reveal in Navigator
                            </button>
                        )}
                    </div>
                )}
            </div>
        </details>
    );
}
