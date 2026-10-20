import { canvasPoint } from './board-geometry';
import { resolveBoardMove } from './board-alignment';
import { paintBoardGuides, paintBoardMovement } from './board-pointer-paint';
import { resizeBoardObject } from './board-resize-geometry';
import { paintBoardResizePreview } from './board-resize-preview';
import type { BoardGesture } from './board-pointer-types';
import type { BoardPoint } from './board-types';
import type { BoardCameraController } from './use-board-camera';

export function paintBoardGesturePreview({
    gesture,
    local,
    camera,
    viewport,
    guides,
    altKey,
    shiftKey,
}: {
    gesture: Extract<BoardGesture, { kind: 'move' | 'resize' }>;
    local: BoardPoint;
    camera: BoardCameraController;
    viewport: HTMLElement | null;
    guides: HTMLElement | null;
    altKey: boolean;
    shiftKey: boolean;
}) {
    //
    // A click must not snap or resize the block when the release sample is flushed.
    //
    if (
        !gesture.activated &&
        Math.hypot(
            local.x - gesture.screenStart.x,
            local.y - gesture.screenStart.y,
        ) < 6
    )
        return;
    gesture.activated = true;
    if (viewport) viewport.dataset.gesture = gesture.kind;
    const point = canvasPoint(local, camera.cameraRef.current);
    const delta = {
        x: point.x - gesture.start.x,
        y: point.y - gesture.start.y,
    };
    if (gesture.kind === 'resize') {
        const objects = gesture.originals.map((object) =>
            resizeBoardObject({
                object,
                axis: gesture.axis,
                delta,
                snap: camera.snap && !altKey,
                freeAspect: shiftKey,
            }),
        );
        gesture.preview = paintBoardResizePreview(
            viewport,
            objects,
            gesture.axis,
            gesture.paintTargets,
        );
    } else {
        const result = resolveBoardMove({
            originals: gesture.originals,
            objects: gesture.targets,
            delta,
            zoom: camera.cameraRef.current.zoom,
            snapToGrid: camera.snap,
            smartGuides: camera.guides,
            bypassSnap: altKey,
        });
        gesture.preview = result.objects;
        gesture.guides = result.guides;
        paintBoardMovement(viewport, gesture.preview, gesture.paintTargets);
    }
    paintBoardGuides(guides, gesture.guides);
}
