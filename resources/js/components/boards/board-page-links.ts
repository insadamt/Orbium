import type { MouseEvent } from 'react';
import { openLocation } from '@/components/navigation/tab-navigation';

export function openBoardPageLink(event: MouseEvent<HTMLElement>) {
    if (
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
    )
        return;
    const target = event.target as Element;
    if (target.closest('[data-board-editor]')) return;
    const link = target.closest('a');
    const href = link?.getAttribute('href');
    if (
        !href ||
        !/^\/workspaces\/[1-9]\d*\/(documents|databases|boards|nodes)\/[1-9]\d*$/.test(
            href,
        )
    )
        return;
    //
    // Delegate at the Board surface so prepared DOM previews and React previews share the normal app-tab navigation.
    //
    event.preventDefault();
    event.stopPropagation();
    openLocation(href, true);
}
