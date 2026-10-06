import type { SplitTabs, Tab } from './navigation-store';

type NavigationSnapshot = {
    storageKey: string;
    tabs: Tab[];
    activeId: string;
    recent: number[];
    containerViews: Record<string, string>;
    splitGroups: SplitTabs[];
};

let pendingSnapshot: NavigationSnapshot | undefined;
let scheduledFrame: number | undefined;
let scheduledTimer: number | undefined;

export function flushNavigationPersistence() {
    if (scheduledFrame !== undefined) cancelAnimationFrame(scheduledFrame);
    if (scheduledTimer !== undefined) clearTimeout(scheduledTimer);
    scheduledFrame = undefined;
    scheduledTimer = undefined;
    const snapshot = pendingSnapshot;
    pendingSnapshot = undefined;
    if (!snapshot?.storageKey) return;
    try {
        localStorage.setItem(
            snapshot.storageKey,
            JSON.stringify({
                tabs: snapshot.tabs,
                activeId: snapshot.activeId,
                recent: snapshot.recent,
                containerViews: snapshot.containerViews,
                splitGroups: snapshot.splitGroups,
            }),
        );
    } catch {
        // Browser storage failure must not block navigation.
    }
}

export function scheduleNavigationPersistence(snapshot: NavigationSnapshot) {
    if (pendingSnapshot && pendingSnapshot.storageKey !== snapshot.storageKey)
        flushNavigationPersistence();
    pendingSnapshot = snapshot;
    if (scheduledFrame !== undefined || scheduledTimer !== undefined) return;
    // Coalesce a switch's scroll, activation, and metadata writes after its first frame.
    scheduledFrame = requestAnimationFrame(() => {
        scheduledFrame = undefined;
        scheduledTimer = window.setTimeout(flushNavigationPersistence, 0);
    });
}
