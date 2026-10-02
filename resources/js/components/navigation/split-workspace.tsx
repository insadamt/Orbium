import { useEffect, useState, type ReactNode } from 'react';
import { useNavigation, type Tab } from './navigation-store';
import { openLocation } from './tab-navigation';

function PaneFrame({ tab }: { tab: Tab }) {
    const [initialUrl] = useState(() => tab.entries[tab.index].url);
    const location = tab.entries[tab.index];

    return (
        <section className="split-pane" aria-label={`${location.title} pane`}>
            <iframe
                title={`${location.title} pane`}
                name={`orbium-pane:${tab.id}`}
                src={initialUrl}
            />
        </section>
    );
}

export function SplitWorkspace({ children }: { children: ReactNode }) {
    const splitTabs = useNavigation((state) => state.splitTabs);
    const tabs = useNavigation((state) => state.tabs);
    const activeId = useNavigation((state) => state.activeId);

    useEffect(() => {
        function receivePaneNavigation(event: MessageEvent) {
            if (event.origin !== window.location.origin || !splitTabs) return;
            const data = event.data;
            if (
                data?.type === 'orbium:pane-new-tab' &&
                typeof data.url === 'string'
            ) {
                openLocation(data.url, true);
                return;
            }
            if (
                data?.type !== 'orbium:pane-location' ||
                typeof data.url !== 'string' ||
                typeof data.tabId !== 'string' ||
                typeof data.title !== 'string'
            )
                return;
            if (
                data.tabId !== splitTabs.leftId &&
                data.tabId !== splitTabs.rightId
            )
                return;
            const navigation = useNavigation.getState();
            const tab = navigation.tabs.find((item) => item.id === data.tabId);
            if (
                !tab ||
                (tab.entries[tab.index].url === data.url &&
                    tab.entries[tab.index].title === data.title)
            )
                return;
            navigation.recordPane(data.tabId, {
                url: data.url,
                title: data.title,
                kind: data.kind,
                scroll: 0,
            });
        }
        window.addEventListener('message', receivePaneNavigation);
        return () =>
            window.removeEventListener('message', receivePaneNavigation);
    }, [splitTabs]);

    if (
        !splitTabs ||
        (activeId !== splitTabs.leftId && activeId !== splitTabs.rightId)
    )
        return <>{children}</>;

    const otherId =
        activeId === splitTabs.leftId ? splitTabs.rightId : splitTabs.leftId;
    const otherTab = tabs.find((tab) => tab.id === otherId);
    if (!otherTab) return <>{children}</>;

    const activePane = (
        <section className="split-pane split-pane-active">{children}</section>
    );
    const otherPane = <PaneFrame key={otherId} tab={otherTab} />;

    return (
        <div
            className="split-workspace"
            data-placed-side={
                splitTabs.placedId === splitTabs.leftId ? 'left' : 'right'
            }
        >
            <div
                className={`split-pane-position split-pane-position-left ${splitTabs.placedId === splitTabs.leftId ? 'split-pane-new' : 'split-pane-existing'}`}
            >
                {activeId === splitTabs.leftId ? activePane : otherPane}
            </div>
            <div
                className={`split-pane-position split-pane-position-right ${splitTabs.placedId === splitTabs.rightId ? 'split-pane-new' : 'split-pane-existing'}`}
            >
                {activeId === splitTabs.rightId ? activePane : otherPane}
            </div>
        </div>
    );
}
