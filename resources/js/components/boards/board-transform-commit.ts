// Summary: Commits a completed Board move/resize once, depending on record validation and pointer painting to restore rejected geometry.

import { paintBoardObjects } from './board-pointer-paint';
import type { BoardGesture } from './board-pointer-types';
import type { BoardObjectsController } from './use-board-objects';

export function commitBoardTransform(
    model: BoardObjectsController,
    gesture: Extract<BoardGesture, { kind: 'move' | 'resize' }>,
    viewport: HTMLElement | null,
) {
    if (gesture.kind === 'move')
        paintBoardObjects(viewport, gesture.preview, gesture.paintTargets);
    const changed = gesture.preview.some(
        (object, index) =>
            object.data !== gesture.originals[index].data ||
            ['x', 'y', 'width', 'height'].some(
                (field) =>
                    object[field as 'x'] !==
                    gesture.originals[index][field as 'x'],
            ),
    );
    if (!changed) return;
    const replacements = new Map(
        gesture.preview.map((object) => [object.id, object]),
    );
    const accepted = model.commit(
        model.objectsRef.current.map(
            (object) => replacements.get(object.id) ?? object,
        ),
    );
    if (!accepted) paintBoardObjects(viewport, gesture.originals);
}
