import { useEffect, useState, type ReactNode } from 'react';
import { useNavigation, type Tab } from './navigation-store';
import { openLocation } from './tab-navigation';

function PaneFrame({ tab }: { tab: Tab }) {
    const [initialUrl] = useState(() => tab.entries[tab.index].url);
    const [isReady, setIsReady] = useState(false);
    const location = tab.entries[tab.index];

    return (
        <section
            className="split-pane split-pane-framed"
            data-split-pane-id={tab.id}
            aria-label={`${location.title} pane`}
        >
            {!isReady && (
                <div className="split-pane-loading" role="status">
                    Loading {location.title}…
                </div>
            )}
            <iframe
                title={`${location.title} pane`}
                name={`orbium-pane:${tab.id}`}
                src={initialUrl}
                loading="eager"
                className={isReady ? 'is-ready' : ''}
                onLoad={() => setIsReady(true)}
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
            const currentLocation = tab?.entries[tab.index];
            if (
                !currentLocation ||
                (currentLocation.url === data.url &&
                    currentLocation.title === data.title &&
                    (data.icon === undefined ||
                        currentLocation.icon === data.icon) &&
                    (data.iconUrl === undefined ||
                        currentLocation.iconUrl === data.iconUrl))
            )
                return;
            navigation.recordPane(data.tabId, {
                url: data.url,
                title: data.title,
                kind: data.kind,
                scroll: 0,
                icon: data.icon,
                iconUrl: data.iconUrl,
            });
        }
        window.addEventListener('message', receivePaneNavigation);
        return () =>
            window.removeEventListener('message', receivePaneNavigation);
    }, [splitTabs]);

    if (!splitTabs) return <>{children}</>;

    const leftTab = tabs.find((tab) => tab.id === splitTabs.leftId);
    const rightTab = tabs.find((tab) => tab.id === splitTabs.rightId);
    if (!leftTab || !rightTab) return <>{children}</>;

    const isGroupActive =
        activeId === splitTabs.leftId || activeId === splitTabs.rightId;

    return (
        <>
            {!isGroupActive && children}
            <div
                key="persistent-split"
                className={`split-workspace ${isGroupActive ? 'is-active' : 'is-dormant'}`}
                aria-hidden={!isGroupActive}
            >
                <div className="split-pane-position split-pane-position-left">
                    <PaneFrame key={leftTab.id} tab={leftTab} />
                </div>
                <div className="split-pane-position split-pane-position-right">
                    <PaneFrame key={rightTab.id} tab={rightTab} />
                </div>
            </div>
        </>
    );
}
