import type { Tab } from './navigation-store';

export function splitPagePath(tab: Tab): string | null {
    const location = tab.entries[tab.index];
    const path = location.url.split('?')[0];
    if (!/^\/workspaces\/\d+\/(documents|databases)\/\d+$/.test(path))
        return null;
    return path;
}

export function canSplitTabs(
    first: Tab | undefined,
    second: Tab | undefined,
): boolean {
    if (!first || !second || first.id === second.id) return false;
    const firstPath = splitPagePath(first);
    const secondPath = splitPagePath(second);
    return Boolean(firstPath && secondPath && firstPath !== secondPath);
}
