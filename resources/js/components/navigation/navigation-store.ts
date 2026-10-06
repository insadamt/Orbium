import { router } from '@inertiajs/react';
import { allowTabClose, useTabPageCache } from './tab-page-cache';
import { create } from 'zustand';
import {
    groupForTab,
    reorderTabGroups,
    restoreSplitGroups,
} from './split-group-state';
import { canSplitTabs } from './split-tab-rules';

export type Location = {
    url: string;
    title: string;
    kind: 'workspace' | 'document' | 'database' | 'settings';
    scroll: number;
    viewState?: Record<string, unknown>;
    icon?: string | null;
    iconUrl?: string | null;
};
export type Tab = {
    id: string;
    entries: Location[];
    index: number;
    pinned?: boolean;
};
export type SplitTabs = { leftId: string; rightId: string; placedId?: string };
type NavigationState = {
    tabs: Tab[];
    activeId: string;
    storageKey: string;
    pending: boolean;
    recent: number[];
    containerViews: Record<string, string>;
    splitGroups: SplitTabs[];
    initialize: (userId: number) => void;
    record: (location: Location, nodeId?: number) => void;
    createTab: (location: Location) => void;
    activate: (id: string) => void;
    close: (id: string) => void;
    moveTab: (activeId: string, overId: string) => void;
    setPinned: (id: string, pinned: boolean) => void;
    updateCurrentIcon: (icon: string | null, iconUrl: string | null) => void;
    forgetWorkspace: (workspaceId: number) => void;
    step: (delta: number) => void;
    saveScroll: () => void;
    setContainerView: (key: string, value: string) => void;
    splitTab: (id: string, edge: 'left' | 'right') => void;
    clearSplit: (tabId: string) => void;
    recordPane: (id: string, location: Location) => void;
};
function restoreContainerViews(value: {
    tabs: Tab[];
    activeId: string;
    containerViews?: Record<string, unknown>;
}): Record<string, string> {
    const views: Record<string, string> = {};
    const entries = value.tabs.flatMap((tab) => tab.entries);
    const activeTab = value.tabs.find((tab) => tab.id === value.activeId);
    if (activeTab) entries.push(activeTab.entries[activeTab.index]);
    for (const entry of entries) {
        for (const [key, selectedView] of Object.entries(
            entry.viewState ?? {},
        )) {
            if (
                (key.startsWith('explorer.') || key.startsWith('database.')) &&
                typeof selectedView === 'string'
            ) {
                views[key] = selectedView;
            }
        }
    }
    for (const [key, selectedView] of Object.entries(
        value.containerViews ?? {},
    )) {
        if (
            (key.startsWith('explorer.') || key.startsWith('database.')) &&
            typeof selectedView === 'string'
        ) {
            views[key] = selectedView;
        }
    }
    return views;
}
function persist(state: NavigationState) {
    try {
        localStorage.setItem(
            state.storageKey,
            JSON.stringify({
                tabs: state.tabs,
                activeId: state.activeId,
                recent: state.recent,
                containerViews: state.containerViews,
                splitGroups: state.splitGroups,
            }),
        );
    } catch {
        /* Browser storage may be unavailable or full. */
    }
}
export const useNavigation = create<NavigationState>((set, get) => ({
    tabs: [],
    activeId: '',
    storageKey: '',
    pending: false,
    recent: [],
    containerViews: {},
    splitGroups: [],
    initialize(userId) {
        const storageKey = `orbium.navigation.v1.${userId}`;
        if (get().storageKey === storageKey) return;
        useTabPageCache.setState({ pages: {} });
        let saved: Pick<
            NavigationState,
            'tabs' | 'activeId' | 'recent' | 'containerViews' | 'splitGroups'
        > = {
            tabs: [],
            activeId: '',
            recent: [],
            containerViews: {},
            splitGroups: [],
        };
        try {
            const value = JSON.parse(
                localStorage.getItem(storageKey) ?? 'null',
            );
            if (
                value &&
                Array.isArray(value.tabs) &&
                value.tabs.every(
                    (tab: Tab) =>
                        typeof tab.id === 'string' &&
                        Array.isArray(tab.entries) &&
                        tab.entries.length > 0 &&
                        Number.isInteger(tab.index) &&
                        tab.index >= 0 &&
                        tab.index < tab.entries.length &&
                        tab.entries.every(
                            (entry) =>
                                typeof entry.url === 'string' &&
                                /^\/(workspaces\/\d+|settings\/|dashboard)/.test(
                                    entry.url,
                                ) &&
                                typeof entry.title === 'string',
                        ),
                )
            )
                saved = {
                    tabs: value.tabs.map((tab: Tab) => ({
                        ...tab,
                        pinned: tab.pinned === true,
                        entries: tab.entries.map((entry) => ({
                            ...entry,
                            kind: ['document', 'database', 'settings'].includes(
                                entry.kind,
                            )
                                ? entry.kind
                                : 'workspace',
                        })),
                    })),
                    activeId: value.activeId,
                    recent: Array.isArray(value.recent)
                        ? value.recent.filter(Number.isInteger).slice(0, 40)
                        : [],
                    containerViews: restoreContainerViews(value),
                    splitGroups: restoreSplitGroups(
                        value.splitGroups ?? value.splitTabs,
                        value.tabs,
                    ),
                };
        } catch {
            /* Corrupt local state must not prevent opening the workspace. */
        }
        set({ ...saved, storageKey });
    },
    record(location, nodeId) {
        if (get().pending) return;
        const state = get();
        const active = state.tabs.find((tab) => tab.id === state.activeId);
        const recent = nodeId
            ? [nodeId, ...state.recent.filter((id) => id !== nodeId)].slice(
                  0,
                  40,
              )
            : state.recent;
        if (!active) {
            const id = crypto.randomUUID();
            set({
                tabs: [...state.tabs, { id, entries: [location], index: 0 }],
                activeId: id,
                recent,
            });
        } else {
            const entries =
                active.entries[active.index].url === location.url
                    ? active.entries.map((entry, index) =>
                          index === active.index
                              ? {
                                    ...entry,
                                    title: location.title,
                                    icon: location.icon,
                                    iconUrl: location.iconUrl,
                                }
                              : entry,
                      )
                    : [
                          ...active.entries.slice(0, active.index + 1),
                          location,
                      ].slice(-100);
            set({
                tabs: state.tabs.map((tab) =>
                    tab.id === active.id
                        ? {
                              ...tab,
                              entries,
                              index:
                                  entries.length === active.entries.length &&
                                  active.entries[active.index].url ===
                                      location.url
                                      ? active.index
                                      : entries.length - 1,
                          }
                        : tab,
                ),
                recent,
            });
        }
        const validGroups = restoreSplitGroups(get().splitGroups, get().tabs);
        if (validGroups.length !== get().splitGroups.length)
            set({ splitGroups: validGroups });
        persist(get());
    },
    createTab(location) {
        const id = crypto.randomUUID();
        set({
            tabs: [...get().tabs, { id, entries: [location], index: 0 }],
            activeId: id,
        });
        persist(get());
    },
    activate(activeId) {
        set({ activeId });
        persist(get());
    },
    close(id) {
        const state = get();
        const tabs = state.tabs.filter((tab) => tab.id !== id);
        set({
            tabs,
            splitGroups: state.splitGroups.filter(
                (group) => group.leftId !== id && group.rightId !== id,
            ),
            activeId:
                state.activeId === id
                    ? (tabs.at(-1)?.id ?? '')
                    : state.activeId,
        });
        persist(get());
    },
    moveTab(activeId, overId) {
        const state = get();
        const reordered = reorderTabGroups(
            state.tabs,
            state.splitGroups,
            activeId,
            overId,
        );
        if (!reordered) return;
        set({ tabs: reordered });
        persist(get());
    },
    setPinned(id, pinned) {
        const tabs = get().tabs;
        const tab = tabs.find((item) => item.id === id);
        if (!tab) return;
        const others = tabs.filter((item) => item.id !== id);
        const firstUnpinned = others.findIndex((item) => !item.pinned);
        const insertAt = pinned
            ? firstUnpinned < 0
                ? others.length
                : firstUnpinned
            : others.length;
        others.splice(insertAt, 0, { ...tab, pinned });
        set({ tabs: others });
        persist(get());
    },
    updateCurrentIcon(icon, iconUrl) {
        set({
            tabs: get().tabs.map((tab) =>
                tab.id === get().activeId
                    ? {
                          ...tab,
                          entries: tab.entries.map((entry, index) =>
                              index === tab.index
                                  ? { ...entry, icon, iconUrl }
                                  : entry,
                          ),
                      }
                    : tab,
            ),
        });
        persist(get());
    },
    forgetWorkspace(workspaceId) {
        const workspacePath = `/workspaces/${workspaceId}`;
        const tabs = get().tabs.flatMap((tab) => {
            const entries = tab.entries.filter(
                (entry) =>
                    entry.url !== workspacePath &&
                    !entry.url.startsWith(`${workspacePath}/`) &&
                    !entry.url.startsWith(`${workspacePath}?`),
            );
            return entries.length
                ? [
                      {
                          ...tab,
                          entries,
                          index: Math.min(tab.index, entries.length - 1),
                      },
                  ]
                : [];
        });
        set({
            tabs,
            splitGroups: restoreSplitGroups(get().splitGroups, tabs),
            activeId: tabs.some((tab) => tab.id === get().activeId)
                ? get().activeId
                : (tabs.at(-1)?.id ?? ''),
            recent: [],
        });
        persist(get());
    },
    step(delta) {
        set({
            tabs: get().tabs.map((tab) =>
                tab.id === get().activeId
                    ? {
                          ...tab,
                          index: Math.max(
                              0,
                              Math.min(
                                  tab.entries.length - 1,
                                  tab.index + delta,
                              ),
                          ),
                      }
                    : tab,
            ),
        });
        persist(get());
    },
    setContainerView(key, value) {
        set({ containerViews: { ...get().containerViews, [key]: value } });
        persist(get());
    },
    splitTab(id, edge) {
        const state = get();
        const draggedTab = state.tabs.find((tab) => tab.id === id);
        if (groupForTab(state.splitGroups, id)) return;
        const companionId =
            id === state.activeId
                ? state.tabs.find(
                      (tab) =>
                          !groupForTab(state.splitGroups, tab.id) &&
                          canSplitTabs(draggedTab, tab),
                  )?.id
                : state.activeId;
        const companion = state.tabs.find((tab) => tab.id === companionId);
        if (
            !companionId ||
            groupForTab(state.splitGroups, companionId) ||
            !canSplitTabs(draggedTab, companion)
        )
            return;
        if (!allowTabClose(id) || !allowTabClose(companionId)) return;
        set({
            splitGroups: [
                ...state.splitGroups,
                edge === 'left'
                    ? { leftId: id, rightId: companionId, placedId: id }
                    : { leftId: companionId, rightId: id, placedId: id },
            ],
        });
        persist(get());
    },
    clearSplit(tabId) {
        const group = groupForTab(get().splitGroups, tabId);
        if (!group) return;
        if (!allowTabClose(group.leftId) || !allowTabClose(group.rightId))
            return;
        useTabPageCache.getState().forgetPages([group.leftId, group.rightId]);
        const activeTab = get().tabs.find((tab) => tab.id === get().activeId);
        set({
            splitGroups: get().splitGroups.filter(
                (group) => group.leftId !== tabId && group.rightId !== tabId,
            ),
        });
        persist(get());
        if (activeTab && [group.leftId, group.rightId].includes(activeTab.id)) {
            router.visit(activeTab.entries[activeTab.index].url, {
                preserveScroll: true,
            });
        }
    },
    recordPane(id, location) {
        set({
            tabs: get().tabs.map((tab) =>
                tab.id === id
                    ? tab.entries[tab.index].url === location.url
                        ? {
                              ...tab,
                              entries: tab.entries.map((entry, index) =>
                                  index === tab.index
                                      ? {
                                            ...entry,
                                            title: location.title,
                                            ...(location.icon !== undefined
                                                ? { icon: location.icon }
                                                : {}),
                                            ...(location.iconUrl !== undefined
                                                ? { iconUrl: location.iconUrl }
                                                : {}),
                                        }
                                      : entry,
                              ),
                          }
                        : {
                              ...tab,
                              entries: [
                                  ...tab.entries.slice(0, tab.index + 1),
                                  location,
                              ].slice(-100),
                              index: Math.min(tab.index + 1, 99),
                          }
                    : tab,
            ),
        });
        const validGroups = restoreSplitGroups(get().splitGroups, get().tabs);
        if (validGroups.length !== get().splitGroups.length)
            set({ splitGroups: validGroups });
        persist(get());
    },
    saveScroll() {
        set({
            tabs: get().tabs.map((tab) =>
                tab.id === get().activeId
                    ? {
                          ...tab,
                          entries: tab.entries.map((entry, i) =>
                              i === tab.index
                                  ? { ...entry, scroll: window.scrollY }
                                  : entry,
                          ),
                      }
                    : tab,
            ),
        });
        persist(get());
    },
}));
