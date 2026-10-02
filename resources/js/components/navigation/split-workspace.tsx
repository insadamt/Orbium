import { useEffect, useState, type ReactNode } from 'react';
import { useNavigation, type SplitTabs, type Tab } from './navigation-store';
import { groupForTab } from './split-group-state';
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

function SplitPairWorkspace({
    group,
    leftTab,
    rightTab,
    active,
}: {
    group: SplitTabs;
    leftTab: Tab;
    rightTab: Tab;
    active: boolean;
}) {
    const [hasActivated, setHasActivated] = useState(active);

    useEffect(() => {
        if (active) setHasActivated(true);
    }, [active]);

    // Keep visited frames alive for unsaved edits, but do not boot every restored group at startup.
    if (!active && !hasActivated) return null;

    return (
        <div
            className={`split-workspace ${active ? 'is-active' : 'is-dormant'}`}
            data-split-group={group.leftId}
            aria-hidden={!active}
        >
            <div className="split-pane-position split-pane-position-left">
                <PaneFrame tab={leftTab} />
            </div>
            <div className="split-pane-position split-pane-position-right">
                <PaneFrame tab={rightTab} />
            </div>
        </div>
    );
}

export function SplitWorkspace({ children }: { children: ReactNode }) {
    const splitGroups = useNavigation((state) => state.splitGroups);
    const tabs = useNavigation((state) => state.tabs);
    const activeId = useNavigation((state) => state.activeId);

    useEffect(() => {
        function receivePaneNavigation(event: MessageEvent) {
            if (event.origin !== window.location.origin || !splitGroups.length)
                return;
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
            if (!groupForTab(splitGroups, data.tabId)) return;
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
    }, [splitGroups]);

    if (!splitGroups.length) return <>{children}</>;

    const activeGroup = groupForTab(splitGroups, activeId);

    return (
        <>
            {!activeGroup && children}
            {splitGroups.map((group) => {
                const leftTab = tabs.find((tab) => tab.id === group.leftId);
                const rightTab = tabs.find((tab) => tab.id === group.rightId);
                return leftTab && rightTab ? (
                    <SplitPairWorkspace
                        key={`${group.leftId}:${group.rightId}`}
                        group={group}
                        leftTab={leftTab}
                        rightTab={rightTab}
                        active={group === activeGroup}
                    />
                ) : null;
            })}
        </>
    );
}
