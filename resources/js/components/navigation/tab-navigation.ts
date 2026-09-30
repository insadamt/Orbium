import { router } from '@inertiajs/react';
import type { Page } from '@inertiajs/core';
import { useNavigation, type Location } from './navigation-store';

type PageContext = {
    [key: string]: unknown;
    workspace?: { id: number; name: string };
    node?: { id: number; title: string };
    database?: { id: number; title: string };
    currentNode?: { id: number; title: string } | null;
};
export function locationKind(url: string): Location['kind'] {
    if (url.includes('/documents/')) return 'document';
    if (url.includes('/databases/')) return 'database';
    if (url.startsWith('/settings/')) return 'settings';
    return 'orbit';
}
export function recordPage(page: { url: string; props: PageContext }) {
    const context =
        page.props.node ?? page.props.database ?? page.props.currentNode;
    useNavigation.getState().record(
        {
            url: page.url,
            title:
                context?.title ??
                page.props.workspace?.name ??
                (page.url.startsWith('/settings') ? 'Settings' : 'Home'),
            kind: locationKind(page.url),
            scroll: 0,
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
function applyOrbitReveal(page: Page) {
    const params = new URLSearchParams(page.url.split('?')[1] ?? '');
    const focusId = Number(params.get('focus'));
    const context = page.props as PageContext;
    if (params.get('view') !== 'orbit' || !focusId || !context.workspace)
        return;
    const containerId = context.database?.id ?? context.currentNode?.id ?? 0;
    const state = useNavigation.getState();
    state.updateView(
        context.database
            ? `database.${containerId}.view`
            : `container.${context.workspace.id}.${containerId}.view`,
        'orbit',
    );
    state.updateView(
        `orbit.${context.workspace.id}.${containerId}.selected`,
        focusId,
    );
    if (context.database) state.updateView(`database.${containerId}.query`, '');
}
export function openLocation(url: string, newTab = false) {
    visitTab(
        url,
        (page) => {
            if (newTab)
                useNavigation.getState().createTab({
                    url: page.url,
                    title: 'Loading…',
                    kind: locationKind(page.url),
                    scroll: 0,
                });
        },
        { onRecorded: applyOrbitReveal },
    );
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
