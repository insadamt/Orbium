import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { Tab } from './navigation-store';
import { useNavigation } from './navigation-store';
import { NavigationTabIcon } from './navigation-tab-icon';
import { activateTab } from './tab-navigation';

type Props = {
    left: Tab;
    right: Tab;
    activeId: string;
    floating: boolean;
};

export function SplitNavigationTab({ left, right, activeId, floating }: Props) {
    const isGroupActive = activeId === left.id || activeId === right.id;
    const [focusedId, setFocusedId] = useState(activeId);

    useEffect(() => {
        if (!isGroupActive) setFocusedId(activeId);
    }, [activeId, isGroupActive]);

    function selectPane(tabId: string) {
        if (!isGroupActive) {
            activateTab(tabId);
            setFocusedId(tabId);
            return;
        }
        setFocusedId(tabId);
        const pane = Array.from(
            document.querySelectorAll<HTMLElement>('[data-split-pane-id]'),
        ).find((element) => element.dataset.splitPaneId === tabId);
        const frame = pane?.querySelector('iframe');
        if (frame) frame.focus();
        else pane?.focus({ preventScroll: true });
    }

    return (
        <div
            className={`split-navigation-tab ${floating ? 'floating-tab' : 'my-1.5 rounded-lg'} ${isGroupActive ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/60'}`}
            data-split-tab-ids={`${left.id} ${right.id}`}
            aria-label="Split tab"
        >
            {[left, right].map((tab) => {
                const entry = tab.entries[tab.index];
                return (
                    <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={isGroupActive && tab.id === focusedId}
                        title={entry.title}
                        onClick={() => selectPane(tab.id)}
                        className={`split-navigation-page ${isGroupActive && tab.id === focusedId ? 'is-focused' : ''}`}
                    >
                        <NavigationTabIcon entry={entry} />
                        <span className="truncate">{entry.title}</span>
                    </button>
                );
            })}
            <button
                type="button"
                aria-label="End split"
                title="End split"
                className="split-navigation-close"
                onClick={() => useNavigation.getState().clearSplit()}
            >
                <X size={14} aria-hidden="true" />
            </button>
        </div>
    );
}
