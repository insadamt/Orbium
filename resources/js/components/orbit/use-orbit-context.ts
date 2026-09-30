import { useNavigation } from '@/components/navigation/navigation-store';
import { useTabView } from '@/components/navigation/use-tab-view';

export function useOrbitContext<T>(
    key: string,
    fallback: T,
): [T, (value: T) => void] {
    const previous = useNavigation((state) => {
        const tab = state.tabs.find((item) => item.id === state.activeId);
        if (!tab) return undefined;
        for (let index = tab.index - 1; index >= 0; index--) {
            const value = tab.entries[index].viewState?.[key];
            if (value !== undefined) return value as T;
        }
        return undefined;
    });
    return useTabView(key, previous ?? fallback);
}
