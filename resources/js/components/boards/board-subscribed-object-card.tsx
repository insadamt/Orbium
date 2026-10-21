import { memo, type ComponentProps } from 'react';
import { BoardObjectCard } from './board-object-card';
import type { BoardRecordStore } from './board-record-store';
import { useBoardRecord } from './use-board-record';

export const BoardSubscribedObjectCard = memo(
    function BoardSubscribedObjectCard({
        store,
        objectId,
        ...props
    }: Omit<ComponentProps<typeof BoardObjectCard>, 'object'> & {
        store: BoardRecordStore;
        objectId: string;
    }) {
        const object = useBoardRecord(store, objectId);
        return object ? <BoardObjectCard {...props} object={object} /> : null;
    },
);
