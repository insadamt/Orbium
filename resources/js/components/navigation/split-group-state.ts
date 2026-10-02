import type { SplitTabs, Tab } from './navigation-store';
import { canSplitTabs } from './split-tab-rules';

export function groupForTab(groups: SplitTabs[], tabId: string) {
    return groups.find(
        (group) => group.leftId === tabId || group.rightId === tabId,
    );
}

export function restoreSplitGroups(value: unknown, tabs: Tab[]): SplitTabs[] {
    const candidates = Array.isArray(value) ? value : value ? [value] : [];
    const usedTabIds = new Set<string>();
    const groups: SplitTabs[] = [];

    for (const value of candidates) {
        if (!value || typeof value !== 'object') continue;
        const candidate = value as Record<string, unknown>;
        if (
            typeof candidate.leftId !== 'string' ||
            typeof candidate.rightId !== 'string' ||
            usedTabIds.has(candidate.leftId) ||
            usedTabIds.has(candidate.rightId) ||
            !canSplitTabs(
                tabs.find((tab) => tab.id === candidate.leftId),
                tabs.find((tab) => tab.id === candidate.rightId),
            )
        )
            continue;

        groups.push({
            leftId: candidate.leftId,
            rightId: candidate.rightId,
            placedId:
                candidate.placedId === candidate.leftId ||
                candidate.placedId === candidate.rightId
                    ? candidate.placedId
                    : undefined,
        });
        usedTabIds.add(candidate.leftId);
        usedTabIds.add(candidate.rightId);
    }

    return groups;
}
