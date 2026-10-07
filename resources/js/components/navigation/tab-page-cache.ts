import type { Page } from '@inertiajs/core';
import { toast } from 'sonner';
import { create } from 'zustand';
import { useNavigation } from './navigation-store';

const retainedNavigationMarker = '__orbiumRetainedNavigation';

type CachedTabPage = { page: Page; generation: number };
type TabPageCache = {
    pages: Record<string, CachedTabPage>;
    rememberPage: (page: Page) => void;
    releaseClosedPages: (visibleTabId?: string) => void;
    forgetPages: (tabIds: string[]) => void;
};

type RetainedNavigationProps = Page['props'] & {
    [retainedNavigationMarker]?: { tabId: string };
};

function isRetainedNavigationPage(page: Page): boolean {
    const marker = (page.props as RetainedNavigationProps)[
        retainedNavigationMarker
    ];

    return typeof marker?.tabId === 'string';
}

function retainedNavigationPage(page: Page, tabId: string): Page {
    if (page.component !== 'documents/show') return page;

    const props = page.props as RetainedNavigationProps;
    const document =
        props.document && typeof props.document === 'object'
            ? (props.document as Record<string, unknown>)
            : {};

    return {
        ...page,
        props: {
            ...props,
            document: {
                content: { type: 'doc', content: [] },
                revision: document.revision ?? 0,
                cover_attachment_id: document.cover_attachment_id ?? null,
                cover_aspect_ratio: document.cover_aspect_ratio ?? null,
                icon_attachment_id: document.icon_attachment_id ?? null,
            },
            databaseProperties: [],
            databaseValues: [],
            mentionCandidates: [],
            databaseFiles: [],
            [retainedNavigationMarker]: { tabId },
        },
    };
}

export const useTabPageCache = create<TabPageCache>((set, get) => ({
    pages: {},
    rememberPage(page) {
        if (isRetainedNavigationPage(page)) return;
        const navigation = useNavigation.getState();
        const tab = navigation.tabs.find(
            (item) => item.id === navigation.activeId,
        );
        if (!tab || tab.entries[tab.index].url !== page.url) return;
        const previous = get().pages[tab.id];
        if (previous?.page === page) return;
        set({
            pages: {
                ...get().pages,
                [tab.id]: {
                    page,
                    generation:
                        previous?.page.url === page.url &&
                        previous.page.props.document === page.props.document
                            ? previous.generation
                            : (previous?.generation ?? 0) + 1,
                },
            },
        });
    },
    forgetPages(tabIds) {
        const excluded = new Set(tabIds);
        set({
            pages: Object.fromEntries(
                Object.entries(get().pages).filter(([id]) => !excluded.has(id)),
            ),
        });
    },
    releaseClosedPages(visibleTabId) {
        const tabIds = new Set(
            useNavigation.getState().tabs.map((tab) => tab.id),
        );
        const pages = Object.fromEntries(
            Object.entries(get().pages).filter(
                ([id]) => tabIds.has(id) || id === visibleTabId,
            ),
        );
        if (Object.keys(pages).length !== Object.keys(get().pages).length)
            set({ pages });
    },
}));

export function cachedPageForTab(id: string) {
    const tab = useNavigation.getState().tabs.find((item) => item.id === id);
    const cached = useTabPageCache.getState().pages[id];
    if (cached?.page.url !== tab?.entries[tab.index].url) return undefined;

    return retainedNavigationPage(cached.page, id);
}

export function allowTabClose(tabId: string) {
    const event = new CustomEvent('orbium:before-tab-close', {
        cancelable: true,
        detail: { tabId },
    });
    if (!window.dispatchEvent(event)) {
        toast.info('Finish saving before closing or splitting this document.');
        return false;
    }
    const frame = Array.from(document.querySelectorAll('iframe')).find(
        (item) => item.name === `orbium-pane:${tabId}`,
    );
    if (frame?.contentWindow) {
        const allowed = frame.contentWindow.dispatchEvent(
            new CustomEvent('orbium:before-tab-close', {
                cancelable: true,
                detail: { tabId: '' },
            }),
        );
        if (!allowed)
            toast.info(
                'Finish saving before closing or splitting this document.',
            );
        return allowed;
    }
    return true;
}
