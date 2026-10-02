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
    return (
        <div
            className={`split-navigation-tab ${floating ? 'floating-tab' : 'my-1.5 rounded-lg'} ${activeId === left.id || activeId === right.id ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/60'}`}
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
                        aria-selected={tab.id === activeId}
                        title={entry.title}
                        onClick={() => activateTab(tab.id)}
                        className="split-navigation-page"
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
