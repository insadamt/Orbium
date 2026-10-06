import { router } from '@inertiajs/react';
import type { Page } from '@inertiajs/core';
import { attachmentUrl } from '@/components/editor/editor-api';
import { nodeImageUrl } from '@/components/hierarchy/node-media-api';
import { useNavigation, type Location } from './navigation-store';
import {
    allowTabClose,
    cachedPageForTab,
    useTabPageCache,
} from './tab-page-cache';
import { groupForTab } from './split-group-state';

type PageContext = {
    [key: string]: unknown;
    workspace?: { id: number; name: string };
    node?: { id: number; title: string; icon?: string | null };
    document?: { icon_attachment_id?: number | null };
    database?: {
        id: number;
        title: string;
        icon?: string | null;
        icon_attachment_id?: number | null;
    };
    currentNode?: {
        id: number;
        title: string;
        type: 'folder' | 'document' | 'database';
        icon?: string | null;
        icon_attachment_id?: number | null;
    } | null;
};
export function locationKind(url: string): Location['kind'] {
    if (url.includes('/documents/')) return 'document';
    if (url.includes('/databases/')) return 'database';
    if (url.split('?')[0] === '/trash') return 'trash';
    if (url.startsWith('/settings/')) return 'settings';
    return 'workspace';
}
export function locationForPage(page: {
    url: string;
    props: PageContext;
}): Location {
    const context =
        page.props.node ?? page.props.database ?? page.props.currentNode;
    const workspaceId = page.props.workspace?.id;
    const attachmentId =
        page.props.document?.icon_attachment_id ??
        page.props.database?.icon_attachment_id ??
        page.props.currentNode?.icon_attachment_id;
    const isDocument =
        Boolean(page.props.node) || page.props.currentNode?.type === 'document';
    const iconUrl =
        workspaceId && context && attachmentId
            ? isDocument
                ? attachmentUrl(workspaceId, context.id, attachmentId)
                : nodeImageUrl(workspaceId, context.id, attachmentId)
            : null;
    return {
        url: page.url,
        title:
            context?.title ??
            page.props.workspace?.name ??
            (page.url.split('?')[0] === '/trash'
                ? 'Trash'
                : page.url.startsWith('/settings')
                  ? 'Settings'
                  : 'Home'),
        kind: locationKind(page.url),
        scroll: 0,
        icon: context?.icon ?? null,
        iconUrl,
    };
}
export function notifyPaneLocation(
    details: Pick<Location, 'title' | 'kind' | 'icon' | 'iconUrl'>,
) {
    if (window.self === window.top || !window.name.startsWith('orbium-pane:'))
        return;
    window.parent.postMessage(
        {
            type: 'orbium:pane-location',
            tabId: window.name.slice('orbium-pane:'.length),
            url: window.location.pathname + window.location.search,
            ...details,
        },
        window.location.origin,
    );
}
export function recordPage(page: { url: string; props: PageContext }) {
    const location = locationForPage(page);
    const context =
        page.props.node ?? page.props.database ?? page.props.currentNode;
    useNavigation.getState().record(location, context?.id);
}
function visitTab(
    url: string,
    commit: (page: Page) => void,
    options: {
        scroll?: number;
        onRecorded?: (page: Page) => void;
        activateBeforeVisit?: string;
    } = {},
) {
    const state = useNavigation.getState();
    if (state.pending) return;
    const previousActiveId = state.activeId;
    state.saveScroll();
    if (options.activateBeforeVisit)
        useNavigation.getState().activate(options.activateBeforeVisit);
    const restorePreviousTab = () => {
        if (
            options.activateBeforeVisit &&
            useNavigation.getState().activeId === options.activateBeforeVisit
        )
            useNavigation.getState().activate(previousActiveId);
    };
    router.visit(url, {
        preserveScroll: true,
        onStart: () => useNavigation.setState({ pending: true }),
        onSuccess: (page) => {
            commit(page);
            useNavigation.setState({ pending: false });
            recordPage(page);
            useTabPageCache.getState().rememberPage(page);
            options.onRecorded?.(page);
            requestAnimationFrame(() =>
                window.scrollTo(0, options.scroll ?? 0),
            );
        },
        onError: restorePreviousTab,
        onCancel: restorePreviousTab,
        onFinish: () => useNavigation.setState({ pending: false }),
    });
}
export function openLocation(url: string, newTab = false) {
    const isSettingsLocation = locationKind(url) === 'settings';
    const shouldOpenNewTab = newTab || isSettingsLocation;
    if (window.self !== window.top) {
        if (shouldOpenNewTab) {
            window.parent.postMessage(
                { type: 'orbium:pane-new-tab', url },
                window.location.origin,
            );
            return;
        }
        router.visit(url);
        return;
    }
    if (isSettingsLocation) {
        const navigation = useNavigation.getState();
        const settingsTab =
            navigation.tabs.find(
                (tab) =>
                    tab.id === navigation.activeId &&
                    locationKind(tab.entries[tab.index].url) === 'settings',
            ) ??
            navigation.tabs.find(
                (tab) =>
                    locationKind(tab.entries[tab.index].url) === 'settings',
            );
        if (settingsTab) {
            const currentLocation = settingsTab.entries[settingsTab.index];
            if (currentLocation.url === url) {
                activateTab(settingsTab.id);
                return;
            }
            visitTab(
                url,
                () => useNavigation.getState().activate(settingsTab.id),
                { activateBeforeVisit: settingsTab.id },
            );
            return;
        }
    }
    visitTab(url, (page) => {
        if (shouldOpenNewTab)
            useNavigation.getState().createTab({
                url: page.url,
                title: 'Loading…',
                kind: locationKind(page.url),
                scroll: 0,
            });
    });
}
export function activateTab(id: string) {
    const navigation = useNavigation.getState();
    const tab = navigation.tabs.find((item) => item.id === id);
    if (!tab) return;
    if (navigation.activeId === id || navigation.pending) return;
    const location = tab.entries[tab.index];
    if (restoreCachedTab(id, () => useNavigation.getState().activate(id)))
        return;
    visitTab(location.url, () => useNavigation.getState().activate(id), {
        scroll: location.scroll,
        activateBeforeVisit: id,
    });
}
export function stepHistory(delta: number) {
    const state = useNavigation.getState();
    const tab = state.tabs.find((item) => item.id === state.activeId);
    const location = tab?.entries[tab.index + delta];
    if (!location) return;
    visitTab(location.url, () => useNavigation.getState().step(delta), {
        scroll: location.scroll,
    });
}
export function restoreBrowserHistory(url: string) {
    const state = useNavigation.getState();
    const tab = state.tabs.find((item) => item.id === state.activeId);
    if (!tab || tab.entries[tab.index].url === url) return;

    const previousIndex = tab.entries.findLastIndex(
        (entry, index) => index < tab.index && entry.url === url,
    );
    const nextIndex = tab.entries.findIndex(
        (entry, index) => index > tab.index && entry.url === url,
    );
    const closestIndex =
        previousIndex < 0
            ? nextIndex
            : nextIndex < 0 ||
                tab.index - previousIndex <= nextIndex - tab.index
              ? previousIndex
              : nextIndex;
    if (closestIndex >= 0) state.step(closestIndex - tab.index);
}
export function closeTab(id: string) {
    const state = useNavigation.getState();
    if (state.tabs.find((tab) => tab.id === id)?.pinned) return;
    if (state.tabs.length <= 1 || state.pending) return;
    if (!allowTabClose(id)) return;
    const group = groupForTab(state.splitGroups, id);
    if (group) {
        const companionId = group.leftId === id ? group.rightId : group.leftId;
        if (!allowTabClose(companionId)) return;
        useTabPageCache.getState().forgetPages([companionId]);
    }
    if (state.activeId !== id) {
        state.close(id);
        if (group && [group.leftId, group.rightId].includes(state.activeId)) {
            const activeTab = state.tabs.find(
                (tab) => tab.id === state.activeId,
            );
            if (activeTab)
                visitTab(activeTab.entries[activeTab.index].url, () => {}, {
                    scroll: activeTab.entries[activeTab.index].scroll,
                });
        }
        return;
    }
    const next = state.tabs.filter((tab) => tab.id !== id).at(-1);
    if (!next) return;
    const location = next.entries[next.index];
    if (restoreCachedTab(next.id, () => useNavigation.getState().close(id)))
        return;
    state.saveScroll();
    useNavigation.getState().close(id);
    visitTab(location.url, () => {}, { scroll: location.scroll });
}

function restoreCachedTab(id: string, commit: () => void) {
    const page = cachedPageForTab(id);
    if (!page) return false;
    const navigation = useNavigation.getState();
    const tab = navigation.tabs.find((item) => item.id === id)!;
    navigation.saveScroll();
    useNavigation.setState({ pending: true });
    // Local Inertia visits preserve the shell and retained document DOM without a request.
    commit();
    router.push({
        url: page.url,
        component: page.component,
        props: page.props,
        preserveState: true,
        preserveScroll: true,
        onSuccess: () => {
            requestAnimationFrame(() => {
                window.scrollTo(0, tab.entries[tab.index].scroll);
                if (
                    page.component !== 'documents/show' &&
                    !groupForTab(useNavigation.getState().splitGroups, id)
                ) {
                    window.setTimeout(() => {
                        if (
                            useNavigation.getState().activeId === id &&
                            window.location.pathname +
                                window.location.search ===
                                page.url
                        )
                            router.reload();
                    }, 0);
                }
            });
        },
        onFinish: () => useNavigation.setState({ pending: false }),
    });
    return true;
}
