import { supportsBoardContentHeight } from './board-content-sizing';
import type { KeyboardEvent } from 'react';
import type { BoardObjectsController } from './use-board-objects';
import type { useBoardPointer } from './use-board-pointer';
import { boardLimits } from './board-types';
import { clamp } from './board-geometry';
export function boardKeyboardHandler(
    model: BoardObjectsController,
    pointer: ReturnType<typeof useBoardPointer>,
    beginEditing: (id: string) => void,
    blocked: boolean,
    isLocked: () => boolean,
) {
    return (event: KeyboardEvent<HTMLDivElement>) => {
        if (
            event.defaultPrevented ||
            !event.currentTarget.contains(event.target as Node)
        )
            return;
        if (
            (event.target as Element).closest(
                '[data-board-editor], [data-board-interactive], button, a, input, textarea, select, video, audio, [role=slider]',
            ) ||
            isLocked()
        )
            return;
        if (event.key === 'Escape') {
            event.preventDefault();
            if (!pointer.cancel()) {
                model.select([]);
                model.finishEditing();
            }
            return;
        }
        const modified = event.ctrlKey || event.metaKey;
        if (modified && event.key.toLowerCase() === 'a') {
            event.preventDefault();
            model.select(model.objects.map((object) => object.id));
            return;
        }
        if (blocked) return;
        if (modified && ['z', 'y', 'd'].includes(event.key.toLowerCase())) {
            event.preventDefault();
            if (event.key.toLowerCase() === 'd') model.duplicateSelected();
            else if (event.shiftKey || event.key.toLowerCase() === 'y')
                model.redo();
            else model.undo();
            return;
        }
        if (
            ['Delete', 'Backspace'].includes(event.key) &&
            model.selectedIds.length
        ) {
            event.preventDefault();
            model.deleteSelected();
            return;
        }
        if (event.key === 'Enter' && model.selectedIds.length === 1) {
            event.preventDefault();
            beginEditing(model.selectedIds[0]);
            return;
        }
        if (
            !event.key.startsWith('Arrow') ||
            !model.selectedIds.length ||
            modified
        )
            return;
        event.preventDefault();
        const step = event.shiftKey ? 10 : 1;
        const dx =
            event.key === 'ArrowLeft'
                ? -step
                : event.key === 'ArrowRight'
                  ? step
                  : 0;
        const dy =
            event.key === 'ArrowUp'
                ? -step
                : event.key === 'ArrowDown'
                  ? step
                  : 0;
        model.commit(
            model.objects.map((object) =>
                !model.selectedIds.includes(object.id)
                    ? object
                    : event.altKey
                      ? {
                            ...object,
                            data: {
                                ...object.data,
                                ...(object.block_type === 'image'
                                    ? { image_fit: 'cover' as const }
                                    : {}),
                            },
                            width: clamp(
                                object.width + dx,
                                boardLimits.minWidth,
                                boardLimits.maxSize,
                            ),
                            height: clamp(
                                object.height +
                                    (supportsBoardContentHeight(object)
                                        ? 0
                                        : dy),
                                boardLimits.minHeight,
                                boardLimits.maxSize,
                            ),
                        }
                      : {
                            ...object,
                            x: clamp(
                                object.x + dx,
                                -boardLimits.coordinate,
                                boardLimits.coordinate,
                            ),
                            y: clamp(
                                object.y + dy,
                                -boardLimits.coordinate,
                                boardLimits.coordinate,
                            ),
                        },
            ),
        );
    };
}
