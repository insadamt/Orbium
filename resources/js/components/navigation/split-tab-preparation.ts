import type { Page } from '@inertiajs/core';
import { create } from 'zustand';
import { useNavigation, type Tab } from './navigation-store';
import { hasRetainedDocument, useTabPageCache } from './tab-page-cache';
import { splitPagePath } from './split-tab-rules';

type PreparationState = {
    frameTabIds: string[];
};

export const useSplitPreparation = create<PreparationState>(() => ({
    frameTabIds: [],
}));

const documentRequests = new Map<string, Promise<boolean>>();

async function fetchPreparedDocument({
    tabId,
    url,
    version,
    storageKey,
}: {
    tabId: string;
    url: string;
    version: string | null;
    storageKey: string;
}): Promise<boolean> {
    try {
        const response = await fetch(url, {
            signal: AbortSignal.timeout(15000),
            headers: {
                Accept: 'text/html, application/xhtml+xml',
                'X-Requested-With': 'XMLHttpRequest',
                'X-Inertia': 'true',
                ...(version ? { 'X-Inertia-Version': version } : {}),
            },
        });
        if (!response.ok || response.headers.get('X-Inertia') !== 'true')
            return false;
        const page = (await response.json()) as Page;
        if (
            page.component !== 'documents/show' ||
            page.url !== url ||
            !page.props.document
        )
            return false;
        const savedDocument = page.props.document as {
            content_format_version?: number;
        };
        if (savedDocument.content_format_version === 2)
            await import('@/components/editor/markdown/markdown-editor');
        else await import('@/components/editor/document-editor');
        if (useNavigation.getState().storageKey !== storageKey) return false;
        useTabPageCache.getState().rememberPreparedPage({ tabId, page });
        return hasRetainedDocument(tabId);
    } catch {
        return false;
    }
}

export function prepareTabForSplit(
    tab: Tab,
    version: string | null,
): Promise<boolean> {
    const path = splitPagePath(tab);
    if (!path) return Promise.resolve(false);
    if (hasRetainedDocument(tab.id)) return Promise.resolve(true);
    if (tab.entries[tab.index].kind === 'database') {
        useSplitPreparation.setState((state) => ({
            frameTabIds: state.frameTabIds.includes(tab.id)
                ? state.frameTabIds
                : [...state.frameTabIds, tab.id],
        }));
        return Promise.resolve(true);
    }
    const requestKey = `${useNavigation.getState().storageKey}:${tab.id}:${tab.entries[tab.index].url}`;
    const existing = documentRequests.get(requestKey);
    if (existing) return existing;
    const request = fetchPreparedDocument({
        tabId: tab.id,
        url: tab.entries[tab.index].url,
        version,
        storageKey: useNavigation.getState().storageKey,
    }).finally(() => documentRequests.delete(requestKey));
    documentRequests.set(requestKey, request);
    return request;
}
