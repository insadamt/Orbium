import { useCallback, useSyncExternalStore } from 'react';
import { TextColorMenu } from '@/components/editor/ui/text-color-menu';
import { uniformContentColor } from '@/components/editor/content-selection-color';
import { boardObjectColors, colorBoardObject } from './board-block-color';
import type { BoardObjectsController } from './use-board-objects';

export function BoardSelectionColor({
    model,
    disabled,
}: {
    model: BoardObjectsController;
    disabled: boolean;
}) {
    const subscribe = useCallback(
        (notify: () => void) => model.store.subscribeChanges(() => notify()),
        [model.store],
    );
    const objects = useSyncExternalStore(
        subscribe,
        model.store.getObjects,
        model.store.getObjects,
    );
    const selected = new Set(model.selectedIds);
    const colors = objects
        .filter((object) => selected.has(object.id))
        .flatMap(boardObjectColors);
    if (
        !colors.length ||
        (selected.size === 1 &&
            objects.some(
                (object) =>
                    selected.has(object.id) && object.block_type === 'drawing',
            ))
    )
        return null;
    return (
        <div inert={disabled}>
            <TextColorMenu
                active={!disabled}
                colorLabel="Selection color"
                currentColor={uniformContentColor(colors)}
                onOpen={() => model.breakHistoryGroup()}
                onChoose={(color) => {
                    if (disabled || model.editingId) return;
                    //
                    // Resolve the live selection on each change so a dismissed toolbar cannot recolor old objects.
                    //
                    const ids = new Set(model.selectedRef.current);
                    const next = model.objects.map((object) =>
                        ids.has(object.id) && boardObjectColors(object).length
                            ? colorBoardObject(object, color)
                            : object,
                    );
                    if (
                        next.some(
                            (object, index) => object !== model.objects[index],
                        )
                    )
                        model.commit(next);
                }}
            />
        </div>
    );
}
