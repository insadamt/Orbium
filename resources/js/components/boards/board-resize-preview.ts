import {
    measureBoardContentHeight,
    supportsBoardContentHeight,
} from './board-content-sizing';
import { clamp } from './board-geometry';
import {
    collectBoardPaintTargets,
    type BoardPaintTargets,
    paintBoardObjects,
} from './board-pointer-paint';
import { boardLimits, type BoardObject } from './board-types';

export function paintBoardResizePreview(
    viewport: HTMLElement | null,
    objects: BoardObject[],
    axis: string,
    targets: BoardPaintTargets = collectBoardPaintTargets(viewport),
): BoardObject[] {
    paintBoardObjects(viewport, objects, targets);
    //
    // Measure after painting the new width/scale so the border follows wrapping during the gesture.
    // Keep these measurements in the preview; pointer release owns the single history/save action.
    //
    const measuredObjects = objects.map((object) => {
        if (!supportsBoardContentHeight(object)) return object;
        const preview = targets
            .get(object.id)
            ?.querySelector<HTMLElement>('.board-object-preview');
        if (!preview) return object;
        const height = measureBoardContentHeight(preview);
        return {
            ...object,
            height,
            y: axis.includes('n')
                ? clamp(
                      object.y + object.height - height,
                      -boardLimits.coordinate,
                      boardLimits.coordinate,
                  )
                : object.y,
        };
    });
    paintBoardObjects(viewport, measuredObjects, targets);
    return measuredObjects;
}
