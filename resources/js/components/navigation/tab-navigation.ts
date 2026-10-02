import { router } from '@inertiajs/react';
import type { Page } from '@inertiajs/core';
import { attachmentUrl } from '@/components/editor/editor-api';
import { nodeImageUrl } from '@/components/hierarchy/node-media-api';
import { useNavigation, type Location } from './navigation-store';

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
export function recordPage(page: { url: string; props: PageContext }) {
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
    useNavigation.getState().record(
        {
            url: page.url,
            title:
                context?.title ??
                page.props.workspace?.name ??
                (page.url.startsWith('/settings') ? 'Settings' : 'Home'),
            kind: locationKind(page.url),
            scroll: 0,
            icon: context?.icon ?? null,
            iconUrl,
        },
        context?.id,
    );
}
function visitTab(
    url: string,
    commit: (page: Page) => void,
    options: { scroll?: number; onRecorded?: (page: Page) => void } = {},
) {
    const state = useNavigation.getState();
    if (state.pending) return;
    state.saveScroll();
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
        onFinish: () => useNavigation.setState({ pending: false }),
    });
}
export function openLocation(url: string, newTab = false) {
    if (window.self !== window.top) {
        if (newTab) {
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
        if (newTab)
            useNavigation.getState().createTab({
                url: page.url,
                title: 'Loading…',
                kind: locationKind(page.url),
                scroll: 0,
            });
    });
}
export function activateTab(id: string) {
    const tab = useNavigation.getState().tabs.find((item) => item.id === id);
    if (!tab) return;
    const location = tab.entries[tab.index];
    visitTab(location.url, () => useNavigation.getState().activate(id), {
        scroll: location.scroll,
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
