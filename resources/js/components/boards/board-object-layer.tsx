// Summary: Presents per-record native object shells without rebuilding domain state; depends on visibility, selection and the existing edit/lock callbacks.

import type { ComponentProps } from 'react';
import { BoardSubscribedObjectCard } from './board-subscribed-object-card';
import type { BoardObject } from './board-types';
import type { BoardObjectsController } from './use-board-objects';

type BoardObjectLayerProps = Omit<
    ComponentProps<typeof BoardSubscribedObjectCard>,
    'objectId' | 'store' | 'selected' | 'editing' | 'blocked'
> & {
    objects: BoardObject[];
    model: Pick<BoardObjectsController, 'store' | 'selectedIds' | 'editingId'>;
    blocked: boolean;
    editingLocked: boolean;
};

export function BoardObjectLayer({
    objects,
    model,
    blocked,
    editingLocked,
    ...props
}: BoardObjectLayerProps) {
    return objects.map((object) => (
        <BoardSubscribedObjectCard
            {...props}
            key={object.id}
            store={model.store}
            objectId={object.id}
            selected={model.selectedIds.includes(object.id)}
            editing={model.editingId === object.id}
            blocked={
                blocked || (object.id !== model.editingId && editingLocked)
            }
        />
    ));
}
