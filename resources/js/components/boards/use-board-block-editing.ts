import { useCallback, type RefObject } from 'react';
import type { BoardObjectsController } from './use-board-objects';
import type {
    BoardBlockData,
    BoardBlockReplacement,
    BoardObject,
} from './board-types';

export function useBoardBlockEditing(model: RefObject<BoardObjectsController>) {
    const updateBlockContent = useCallback(
        (
            id: string,
            data: BoardBlockData,
            history: 'typing' | 'action' = 'action',
        ) => {
            const current = model.current;
            return current.commit(
                current.objectsRef.current.map((object) =>
                    object.id === id ? { ...object, data } : object,
                ),
                history === 'typing' ? `content:${id}` : null,
            );
        },
        [model],
    );
    const transformBlock = useCallback(
        (id: string, replacement: BoardBlockReplacement) => {
            const current = model.current;
            //
            // Conversion keeps the spatial identity and uses the same validated, undoable snapshot as ordinary edits.
            //
            const accepted = current.commit(
                current.objectsRef.current.map((object) =>
                    object.id === id
                        ? {
                              ...object,
                              block_type: replacement.kind,
                              data: replacement.data,
                          }
                        : object,
                ),
            );
            if (accepted) current.resetEditorContent();
            return accepted;
        },
        [model],
    );
    const updateContentHeight = useCallback(
        (id: string, height: number) => {
            model.current.updateMeasuredHeight(id, height);
        },
        [model],
    );
    const breakHistoryGroup = useCallback(
        () => model.current.breakHistoryGroup(),
        [model],
    );
    const updateBlockObject = useCallback(
        (replacement: BoardObject) => {
            const current = model.current;
            return current.commit(
                current.objectsRef.current.map((object) =>
                    object.id === replacement.id ? replacement : object,
                ),
            );
        },
        [model],
    );
    return {
        updateBlockObject,
        updateBlockContent,
        transformBlock,
        updateContentHeight,
        breakHistoryGroup,
    };
}
