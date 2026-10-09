import { useNavigation } from './navigation-store';
import { groupForTab } from './split-group-state';
import { allowTabClose, hasRetainedDocument } from './tab-page-cache';
import { animateSplitExit } from './split-workspace-motion';

export function endSplitWithMotion(tabId: string) {
    const navigation = useNavigation.getState();
    const group = groupForTab(navigation.splitGroups, tabId);
    if (!group) return;
    const memberIds = [group.leftId, group.rightId];
    if (memberIds.some((id) => !hasRetainedDocument(id) && !allowTabClose(id)))
        return;
    navigation.saveScroll();
    const survivorId = memberIds.includes(navigation.activeId)
        ? navigation.activeId
        : group.leftId;
    const outgoingId =
        survivorId === group.leftId ? group.rightId : group.leftId;
    animateSplitExit({
        outgoingId,
        survivorId,
        commit: () => {
            const current = useNavigation.getState();
            if (
                current.activeId !== navigation.activeId ||
                !groupForTab(current.splitGroups, tabId)
            )
                return false;
            current.clearSplit(tabId);
            return !groupForTab(useNavigation.getState().splitGroups, tabId);
        },
    });
}
