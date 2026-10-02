import type { SplitTabs, Tab } from './navigation-store';
import { canSplitTabs } from './split-tab-rules';

export function groupForTab(groups: SplitTabs[], tabId: string) {
    return groups.find(
        (group) => group.leftId === tabId || group.rightId === tabId,
    );
}

export function reorderTabGroups(
    tabs: Tab[],
    groups: SplitTabs[],
    activeId: string,
    overId: string,
): Tab[] | null {
    const orderedGroups: Tab[][] = [];
    const visited = new Set<string>();
    for (const tab of tabs) {
        if (visited.has(tab.id)) continue;
        const group = groupForTab(groups, tab.id);
        const members = group
            ? tabs.filter(
                  (candidate) =>
                      candidate.id === group.leftId ||
                      candidate.id === group.rightId,
              )
            : [tab];
        members.forEach((member) => visited.add(member.id));
        orderedGroups.push(members);
    }

    const from = orderedGroups.findIndex((members) =>
        members.some((tab) => tab.id === activeId),
    );
    const to = orderedGroups.findIndex((members) =>
        members.some((tab) => tab.id === overId),
    );
    if (
        from < 0 ||
        to < 0 ||
        from === to ||
        Boolean(orderedGroups[from][0].pinned) !==
            Boolean(orderedGroups[to][0].pinned)
    )
        return null;

    orderedGroups.splice(to, 0, ...orderedGroups.splice(from, 1));
    return orderedGroups.flat();
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
