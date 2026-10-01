import { useNavigation } from './navigation-store';

export function useContainerView<T extends string>(
    key: string,
    fallback: T,
): [T, (value: T) => void] {
    const selectedView = useNavigation((state) => state.containerViews[key]);
    return [
        (selectedView as T | undefined) ?? fallback,
        (next) => useNavigation.getState().setContainerView(key, next),
    ];
}
