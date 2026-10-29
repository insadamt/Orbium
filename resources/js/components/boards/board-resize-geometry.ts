// Summary: Calculates bounded resize previews while preserving content-specific sizing; depends on Board limits and automatic-height rules.

import { supportsBoardContentHeight } from './board-content-sizing';
import { clamp, snapped } from './board-geometry';
import { boardLimits, type BoardObject, type BoardPoint } from './board-types';

export function resizeBoardObject({
    object,
    axis,
    delta,
    snap,
    freeAspect,
}: {
    object: BoardObject;
    axis: string;
    delta: BoardPoint;
    snap: boolean;
    freeAspect: boolean;
}): BoardObject {
    const west = axis.includes('w');
    const north = axis.includes('n');
    const horizontal = west || axis.includes('e');
    const vertical = north || axis.includes('s');
    const automaticHeight = supportsBoardContentHeight(object);
    if (automaticHeight && vertical && !horizontal) return object;
    const corner = horizontal && vertical;
    let width = horizontal
        ? snapped(object.width + (west ? -delta.x : delta.x), snap)
        : object.width;
    let height = vertical
        ? snapped(object.height + (north ? -delta.y : delta.y), snap)
        : object.height;
    let data = object.data;

    if (
        corner &&
        object.block_type !== 'mindmap' &&
        object.block_type !== 'shape' &&
        !(object.block_type === 'image' && freeAspect)
    ) {
        const ratio = object.width / object.height;
        let scale =
            Math.abs(delta.x / object.width) >=
            Math.abs(delta.y / object.height)
                ? width / object.width
                : height / object.height;
        const textScale = data.text_scale ?? 1;
        scale = clamp(
            scale,
            Math.max(
                boardLimits.minWidth / object.width,
                boardLimits.minHeight / object.height,
                0.25 / textScale,
            ),
            Math.min(
                boardLimits.maxSize / object.width,
                boardLimits.maxSize / object.height,
                8 / textScale,
            ),
        );
        width = object.width * scale;
        height = width / ratio;
        data = {
            ...data,
            text_scale: clamp(textScale * scale, 0.25, 8),
        };
    }
    if (object.block_type === 'shape' && corner && freeAspect) {
        //
        // Shape proportions can be constrained without scaling their independent labels.
        //
        const minimum = Math.max(
            boardLimits.minWidth / object.width,
            boardLimits.minHeight / object.height,
        );
        const maximum = Math.min(
            boardLimits.maxSize / object.width,
            boardLimits.maxSize / object.height,
        );
        const scale = clamp(
            Math.abs(delta.x / object.width) >=
                Math.abs(delta.y / object.height)
                ? width / object.width
                : height / object.height,
            minimum,
            maximum,
        );
        width = object.width * scale;
        height = object.height * scale;
    }
    const circle =
        object.block_type === 'shape' && object.data.shape?.kind === 'circle';
    if (circle) {
        const side = clamp(
            corner
                ? Math.abs(delta.x) >= Math.abs(delta.y)
                    ? width
                    : height
                : horizontal
                  ? width
                  : height,
            Math.max(boardLimits.minWidth, boardLimits.minHeight),
            boardLimits.maxSize,
        );
        width = side;
        height = side;
    }
    if (object.block_type === 'image' && (!corner || freeAspect))
        data = { ...data, image_fit: 'cover' };
    width = clamp(width, boardLimits.minWidth, boardLimits.maxSize);
    height = clamp(height, boardLimits.minHeight, boardLimits.maxSize);
    //
    // Clamp dimensions before moving the origin so the opposite edge stays anchored at minimum size.
    //
    return {
        ...object,
        data,
        x: clamp(
            west
                ? object.x + object.width - width
                : circle && !horizontal
                  ? object.x + (object.width - width) / 2
                  : object.x,
            -boardLimits.coordinate,
            boardLimits.coordinate,
        ),
        y: clamp(
            north
                ? object.y + object.height - height
                : circle && !vertical
                  ? object.y + (object.height - height) / 2
                  : object.y,
            -boardLimits.coordinate,
            boardLimits.coordinate,
        ),
        width,
        height,
    };
}
