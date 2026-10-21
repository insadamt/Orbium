import { useCallback, useSyncExternalStore } from 'react';
import type { BoardRecordStore } from './board-record-store';

export function useBoardRecord(
    store: BoardRecordStore,
    id: string | undefined,
) {
    const subscribe = useCallback(
        (listener: () => void) =>
            id ? store.subscribeObject(id, listener) : () => {},
        [store, id],
    );
    const read = useCallback(
        () => (id ? store.getObject(id) : undefined),
        [store, id],
    );
    return useSyncExternalStore(subscribe, read, read);
}
