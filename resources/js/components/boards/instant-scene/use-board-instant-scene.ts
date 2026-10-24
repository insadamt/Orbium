import { useEffect, useMemo, useSyncExternalStore } from 'react';
import type { BoardRecordStore } from '../board-record-store';
import {
    useBoardWorkScheduler,
    useBoardPreparedPreviews,
} from '../board-resource-previews';
import type { BoardObject } from '../board-types';
import { BoardInstantScene } from './board-instant-scene';
import type { BoardRendererMode } from './board-renderer-mode';

export function useBoardInstantScene({
    mode,
    store,
    boardId,
}: {
    mode: BoardRendererMode;
    store: BoardRecordStore;
    boardId: number;
}) {
    const scheduler = useBoardWorkScheduler();
    const prepared = useBoardPreparedPreviews();
    const scene = useMemo(
        () =>
            mode === 'instant'
                ? new BoardInstantScene({ store, scheduler, prepared, boardId })
                : null,
        [mode, store, scheduler, prepared, boardId],
    );
    useEffect(() => scene?.connect(), [scene]);
    return scene;
}

const noPinnedIds: readonly string[] = [];
const subscribeNoPins = () => () => {};
const readNoPins = () => noPinnedIds;

export function useBoardInstantScenePresentation(
    scene: BoardInstantScene | null,
    presented: BoardObject[],
    editingId: string | null,
) {
    useEffect(() => {
        scene?.updatePresentation(
            presented.map((object) => object.id),
            editingId,
        );
    }, [scene, presented, editingId]);
}

export function useBoardPdfPinnedIds(scene: BoardInstantScene | null) {
    return useSyncExternalStore(
        scene?.pdfs.subscribePins ?? subscribeNoPins,
        scene?.pdfs.getPinnedIds ?? readNoPins,
        readNoPins,
    );
}
