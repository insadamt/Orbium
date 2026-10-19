import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigation, type Tab } from './navigation-store';
import { groupForTab } from './split-group-state';
import { openLocation } from './tab-navigation';
import { useTabPageCache } from './tab-page-cache';
import { useSplitPreparation } from './split-tab-preparation';
import { usePaneFrameHeight } from './use-pane-frame-height';
import { SplitDocumentLoading } from './split-document-loading';
import { splitPagePath } from './split-tab-rules';
import { useSplitPaneScroll } from './use-split-pane-scroll';

function PaneFrame({
    tab,
    side,
    active,
}: {
    tab: Tab;
    side?: 'left' | 'right';
    active: boolean;
}) {
    const paneRef = useSplitPaneScroll({
        tabId: tab.id,
        split: Boolean(side),
        visible: active,
    });
    const [initialUrl, setInitialUrl] = useState(
        () => tab.entries[tab.index].url,
    );
    const [isReady, setIsReady] = useState(false);
    const [loadVersion, setLoadVersion] = useState(0);
    const frameRef = useRef<HTMLIFrameElement>(null);
    const height = usePaneFrameHeight({
        frameRef,
        isReady,
        active,
        loadVersion,
    });
    const location = tab.entries[tab.index];
    const previousUrl = useRef(location.url);
    useEffect(() => {
        if (!active && location.url !== previousUrl.current) {
            setIsReady(false);
            setInitialUrl(location.url);
        }
        previousUrl.current = location.url;
    }, [active, location.url]);

    return (
        <section
            ref={paneRef}
            className={`split-pane split-pane-framed split-pane-position ${side ? `split-pane-position-${side}` : ''}`}
            data-workspace-tab-id={tab.id}
            data-split-pane-id={tab.id}
            aria-label={`${location.title} pane`}
            hidden={!active}
            inert={!active}
        >
            {!isReady && (
                <div className="split-pane-loading" role="status">
                    <span>Loading {location.title}…</span>
                </div>
            )}
            <iframe
                ref={frameRef}
                style={{ height }}
                title={`${location.title} pane`}
                name={`orbium-pane:${tab.id}`}
                src={initialUrl}
                loading="eager"
                className={isReady ? 'is-ready' : ''}
                onLoad={() => {
                    setIsReady(true);
                    setLoadVersion((version) => version + 1);
                }}
            />
        </section>
    );
}

export function SplitWorkspace({ children }: { children: ReactNode }) {
    const pages = useTabPageCache((state) => state.pages);
    const frameTabIds = useSplitPreparation((state) => state.frameTabIds);
    const splitGroups = useNavigation((state) => state.splitGroups);
    const tabs = useNavigation((state) => state.tabs);
    const activeId = useNavigation((state) => state.activeId);
    const activeGroup = groupForTab(splitGroups, activeId);

    useEffect(() => {
        if (!activeGroup) return;
        useSplitPreparation.setState((state) => ({
            frameTabIds: Array.from(
                new Set([
                    ...state.frameTabIds,
                    activeGroup.leftId,
                    activeGroup.rightId,
                ]),
            ),
        }));
    }, [activeGroup]);

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

    return (
        <>
            {!activeGroup && children}
            {tabs.map((tab) => {
                const group = groupForTab(splitGroups, tab.id);
                const cachedPage = pages[tab.id]?.page;
                const documentReady =
                    cachedPage?.component === 'documents/show' &&
                    cachedPage.url === tab.entries[tab.index].url;
                if (
                    documentReady ||
                    ((!group || group !== activeGroup) &&
                        !frameTabIds.includes(tab.id))
                )
                    return null;
                const side = group
                    ? group.leftId === tab.id
                        ? 'left'
                        : 'right'
                    : undefined;
                if (splitPagePath(tab)?.includes('/documents/')) {
                    return group === activeGroup && side ? (
                        <SplitDocumentLoading
                            key={tab.id}
                            tab={tab}
                            side={side}
                        />
                    ) : null;
                }
                return (
                    <PaneFrame
                        key={tab.id}
                        tab={tab}
                        side={side}
                        active={Boolean(group && group === activeGroup)}
                    />
                );
            })}
        </>
    );
}
