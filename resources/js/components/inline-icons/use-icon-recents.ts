import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import {
    iconInsertedEvent,
    readIconPreferences,
    rememberIconChoice,
    saveIconPreferences,
} from './icon-preferences';
import type { InlineIconChoice } from './icon-catalog';

export function useIconRecents(host: HTMLElement | null, workspaceId: number) {
    const { auth } = usePage<{ auth: { user: { id: number } } }>().props;
    const accountId = auth.user.id;
    useEffect(() => {
        if (!host) return;
        const key = `orbium:inline-icons:v1:${accountId}:${workspaceId}`;
        const remember = (event: Event) =>
            saveIconPreferences(
                key,
                rememberIconChoice(
                    readIconPreferences(key),
                    (event as CustomEvent<InlineIconChoice>).detail,
                ),
            );
        host.addEventListener(iconInsertedEvent, remember);
        return () => host.removeEventListener(iconInsertedEvent, remember);
    }, [host, workspaceId, accountId]);
}
