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
            const object = current.store.getObject(id);
            if (!object) return false;
            return current.changeObject(
                { ...object, data },
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
            const object = current.store.getObject(id);
            if (!object) return false;
            const accepted = current.changeObject({
                ...object,
                block_type: replacement.kind,
                data: replacement.data,
            });
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
            return current.changeObject(replacement);
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
