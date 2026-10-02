import { router } from '@inertiajs/react';
import type { Page } from '@inertiajs/core';
import { attachmentUrl } from '@/components/editor/editor-api';
import { nodeImageUrl } from '@/components/hierarchy/node-media-api';
import { useNavigation, type Location } from './navigation-store';
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
            (page.url.startsWith('/settings') ? 'Settings' : 'Home'),
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
    const shouldOpenNewTab = newTab || locationKind(url) === 'settings';
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
    const location = tab.entries[tab.index];
    const isSplitTab = Boolean(groupForTab(navigation.splitGroups, id));
    visitTab(location.url, () => useNavigation.getState().activate(id), {
        scroll: location.scroll,
        activateBeforeVisit: isSplitTab ? id : undefined,
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
export function closeTab(id: string) {
    const state = useNavigation.getState();
    if (state.tabs.find((tab) => tab.id === id)?.pinned) return;
    if (state.tabs.length <= 1) return;
    if (state.activeId !== id) {
        state.close(id);
        return;
    }
    const next = state.tabs.filter((tab) => tab.id !== id).at(-1);
    if (!next) return;
    const location = next.entries[next.index];
    visitTab(location.url, () => useNavigation.getState().close(id), {
        scroll: location.scroll,
    });
}
