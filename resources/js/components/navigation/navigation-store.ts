import { create } from 'zustand';
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
function isSplitValid(tabs: Tab[], splitTabs: SplitTabs | null): boolean {
    return Boolean(
        splitTabs &&
        canSplitTabs(
            tabs.find((tab) => tab.id === splitTabs.leftId),
            tabs.find((tab) => tab.id === splitTabs.rightId),
        ),
    );
}
type NavigationState = {
    tabs: Tab[];
    activeId: string;
    storageKey: string;
    pending: boolean;
    recent: number[];
    containerViews: Record<string, string>;
    splitTabs: SplitTabs | null;
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
    clearSplit: () => void;
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
                splitTabs: state.splitTabs,
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
    splitTabs: null,
    initialize(userId) {
        const storageKey = `orbium.navigation.v1.${userId}`;
        if (get().storageKey === storageKey) return;
        let saved: Pick<
            NavigationState,
            'tabs' | 'activeId' | 'recent' | 'containerViews' | 'splitTabs'
        > = {
            tabs: [],
            activeId: '',
            recent: [],
            containerViews: {},
            splitTabs: null,
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
                    splitTabs:
                        value.splitTabs &&
                        typeof value.splitTabs.leftId === 'string' &&
                        typeof value.splitTabs.rightId === 'string' &&
                        value.splitTabs.leftId !== value.splitTabs.rightId &&
                        (value.activeId === value.splitTabs.leftId ||
                            value.activeId === value.splitTabs.rightId) &&
                        canSplitTabs(
                            value.tabs.find(
                                (tab: Tab) => tab.id === value.splitTabs.leftId,
                            ),
                            value.tabs.find(
                                (tab: Tab) =>
                                    tab.id === value.splitTabs.rightId,
                            ),
                        )
                            ? value.splitTabs
                            : null,
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
        if (get().splitTabs && !isSplitValid(get().tabs, get().splitTabs))
            set({ splitTabs: null });
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
            splitTabs:
                state.splitTabs &&
                (state.splitTabs.leftId === id ||
                    state.splitTabs.rightId === id)
                    ? null
                    : state.splitTabs,
            activeId:
                state.activeId === id
                    ? (tabs.at(-1)?.id ?? '')
                    : state.activeId,
        });
        persist(get());
    },
    moveTab(activeId, overId) {
        const tabs = get().tabs;
        const from = tabs.findIndex((tab) => tab.id === activeId);
        const to = tabs.findIndex((tab) => tab.id === overId);
        if (
            from < 0 ||
            to < 0 ||
            Boolean(tabs[from].pinned) !== Boolean(tabs[to].pinned)
        )
            return;
        const reordered = [...tabs];
        reordered.splice(to, 0, ...reordered.splice(from, 1));
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
            splitTabs:
                get().splitTabs &&
                tabs.some((tab) => tab.id === get().splitTabs?.leftId) &&
                tabs.some((tab) => tab.id === get().splitTabs?.rightId)
                    ? get().splitTabs
                    : null,
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
        const companionId =
            id === state.activeId
                ? state.tabs.find((tab) => canSplitTabs(draggedTab, tab))?.id
                : state.activeId;
        const companion = state.tabs.find((tab) => tab.id === companionId);
        if (!companionId || !canSplitTabs(draggedTab, companion)) return;
        set({
            splitTabs:
                edge === 'left'
                    ? { leftId: id, rightId: companionId, placedId: id }
                    : { leftId: companionId, rightId: id, placedId: id },
        });
        persist(get());
    },
    clearSplit() {
        set({ splitTabs: null });
        persist(get());
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
                                      ? { ...entry, title: location.title }
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
        if (get().splitTabs && !isSplitValid(get().tabs, get().splitTabs))
            set({ splitTabs: null });
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
