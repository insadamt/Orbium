import { create } from 'zustand';

export type Location = {
    url: string;
    title: string;
    kind: 'orbit' | 'document' | 'database' | 'settings';
    scroll: number;
    viewState?: Record<string, unknown>;
};
type Tab = { id: string; entries: Location[]; index: number };
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
                    tabs: value.tabs,
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
                              ? { ...entry, title: location.title }
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
