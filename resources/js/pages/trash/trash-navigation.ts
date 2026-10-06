import { useNavigation } from '@/components/navigation/navigation-store';
import { scheduleNavigationPersistence } from '@/components/navigation/navigation-persistence';
import { restoreSplitGroups } from '@/components/navigation/split-group-state';
import {
    allowTabClose,
    useTabPageCache,
} from '@/components/navigation/tab-page-cache';
import type { DeletionPreview } from './trash-types';

function isDeletedLocation(url: string, preview: DeletionPreview): boolean {
    const match =
        /^\/workspaces\/(\d+)(?:\/(?:nodes|documents|databases)\/(\d+))?/.exec(
            url,
        );
    if (!match) return false;
    return (
        preview.workspace_ids.includes(Number(match[1])) ||
        (match[2] !== undefined && preview.node_ids.includes(Number(match[2])))
    );
}

export function allowDeletedTabCleanup(preview: DeletionPreview): boolean {
    return useNavigation.getState().tabs.every((tab) => {
        const cached = useTabPageCache.getState().pages[tab.id];
        const affected =
            isDeletedLocation(tab.entries[tab.index].url, preview) ||
            (cached && isDeletedLocation(cached.page.url, preview));
        return !affected || allowTabClose(tab.id);
    });
}

export function removeDeletedContentFromNavigation(
    preview: DeletionPreview,
): void {
    const state = useNavigation.getState();
    const affectedTabIds = state.tabs
        .filter((tab) => isDeletedLocation(tab.entries[tab.index].url, preview))
        .map((tab) => tab.id);
    const tabs = state.tabs.flatMap((tab) => {
        if (affectedTabIds.includes(tab.id)) return [];
        const entries = tab.entries.filter(
            (entry) => !isDeletedLocation(entry.url, preview),
        );
        const currentUrl = tab.entries[tab.index].url;
        return [
            {
                ...tab,
                entries,
                index: entries.findIndex((entry) => entry.url === currentUrl),
            },
        ];
    });
    const cachedIds = Object.entries(useTabPageCache.getState().pages)
        .filter(([, cached]) => isDeletedLocation(cached.page.url, preview))
        .map(([id]) => id);
    useTabPageCache.getState().forgetPages([...affectedTabIds, ...cachedIds]);
    useNavigation.setState({
        tabs,
        splitGroups: restoreSplitGroups(state.splitGroups, tabs),
        recent: state.recent.filter((id) => !preview.node_ids.includes(id)),
    });
    scheduleNavigationPersistence(useNavigation.getState());
    try {
        const lastWorkspaceId = Number(
            localStorage.getItem('orbium.lastWorkspaceId'),
        );
        if (preview.workspace_ids.includes(lastWorkspaceId))
            localStorage.removeItem('orbium.lastWorkspaceId');
    } catch {
        // Browser storage availability does not affect deletion.
    }
}
