import { useLayoutEffect, useRef } from 'react';
import { useNavigation } from './navigation-store';

export function useSplitPaneScroll({
    tabId,
    split,
    visible,
}: {
    tabId: string;
    split: boolean;
    visible: boolean;
}) {
    const paneRef = useRef<HTMLDivElement>(null);
    const wasSplit = useRef(false);
    const lastPaneScroll = useRef(0);

    useLayoutEffect(() => {
        const pane = paneRef.current;
        if (!pane) return;
        if (split && !wasSplit.current) {
            const tab = useNavigation
                .getState()
                .tabs.find((tab) => tab.id === tabId);
            pane.scrollTop = tab?.entries[tab.index].scroll ?? 0;
        } else if (!split && wasSplit.current && visible) {
            window.scrollTo(0, lastPaneScroll.current);
        }
        wasSplit.current = split;
        if (!split) return;
        const rememberScroll = () => {
            lastPaneScroll.current = pane.scrollTop;
        };
        rememberScroll();
        pane.addEventListener('scroll', rememberScroll, { passive: true });
        return () => {
            pane.removeEventListener('scroll', rememberScroll);
        };
    }, [split, tabId, visible]);

    return paneRef;
}
