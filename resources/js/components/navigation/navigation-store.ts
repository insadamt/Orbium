import { create } from 'zustand';

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
type NavigationState = {
    tabs: Tab[];
    activeId: string;
    storageKey: string;
    pending: boolean;
    recent: number[];
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
    updateView: (key: string, value: unknown) => void;
};
function persist(state: NavigationState) {
    try {
        localStorage.setItem(
            state.storageKey,
            JSON.stringify({
                tabs: state.tabs,
                activeId: state.activeId,
                recent: state.recent,
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
    initialize(userId) {
        const storageKey = `orbium.navigation.v1.${userId}`;
        if (get().storageKey === storageKey) return;
        let saved: Pick<NavigationState, 'tabs' | 'activeId' | 'recent'> = {
            tabs: [],
            activeId: '',
            recent: [],
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
    updateView(key, value) {
        set({
            tabs: get().tabs.map((tab) =>
                tab.id === get().activeId
                    ? {
                          ...tab,
                          entries: tab.entries.map((entry, index) =>
                              index === tab.index
                                  ? {
                                        ...entry,
                                        viewState: {
                                            ...entry.viewState,
                                            [key]: value,
                                        },
                                    }
                                  : entry,
                          ),
                      }
                    : tab,
            ),
        });
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
