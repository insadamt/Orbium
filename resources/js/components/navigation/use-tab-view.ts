import { useNavigation } from './navigation-store';

export function useTabView<T>(
    key: string,
    fallback: T,
): [T, (value: T) => void] {
    const value = useNavigation((state) => {
        const tab = state.tabs.find((item) => item.id === state.activeId);
        return tab?.entries[tab.index].viewState?.[key] as T | undefined;
    });
    return [
        value ?? fallback,
        (next) => useNavigation.getState().updateView(key, next),
    ];
}
