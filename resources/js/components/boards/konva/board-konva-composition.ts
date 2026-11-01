// Summary: Compiles exact graphics/HTML stacking into bounded visual bands; depends on presented records and native selection/hover barriers.

import { enclosingBounds } from '../board-geometry';
import type { BoardBounds, BoardCamera, BoardObject } from '../board-types';

export const boardKonvaBudgets = {
    bands: 6,
    pixelRatio: 2,
    scenePixels: 24_000_000,
} as const;

export type BoardGraphicsBand = {
    key: string;
    zIndex: number;
    objects: BoardObject[];
};

export function composeBoardGraphics(
    objects: BoardObject[],
    barriers: ReadonlySet<string>,
) {
    const bands: BoardGraphicsBand[] = [];
    let current: BoardGraphicsBand | undefined;
    for (const object of [...objects].sort((a, b) => a.layer - b.layer)) {
        const graphic =
            object.block_type === 'drawing' || object.block_type === 'shape';
        if (graphic) {
            if (!current) {
                current = { key: object.id, zIndex: 0, objects: [] };
                bands.push(current);
            }
            current.objects.push(object);
            current.zIndex = (object.layer + 1) * 2 - 1;
        }
        //
        // A rich shape label or visible native outline must remain between its own ink and every higher object.
        //
        if (
            !graphic ||
            object.block_type === 'shape' ||
            barriers.has(object.id)
        )
            current = undefined;
    }
    return bands;
}

export function boardGraphicsFallback(
    bands: BoardGraphicsBand[],
    camera: BoardCamera,
    width: number,
    height: number,
    ratio: number,
) {
    if (bands.length > boardKonvaBudgets.bands) return 'stacking-budget';
    //
    // Reserve one additional surface for live input; hit canvases remain zero-sized and no Stage buffers are allocated.
    //
    const bandPixels = bands.reduce((pixels, band) => {
        const crop = boardBandViewport(band.objects, camera, width, height);
        return (
            pixels +
            Math.ceil(crop.width * ratio) * Math.ceil(crop.height * ratio)
        );
    }, 0);
    if (
        bandPixels + Math.ceil(width * ratio) * Math.ceil(height * ratio) >
        boardKonvaBudgets.scenePixels
    )
        return 'pixel-budget';
    return null;
}

export function boardBandViewport(
    objects: BoardBounds[],
    camera: BoardCamera,
    width: number,
    height: number,
): BoardBounds {
    const bounds = enclosingBounds(objects);
    if (!bounds) return { x: 0, y: 0, width: 0, height: 0 };
    const x = Math.max(
        0,
        Math.min(width, Math.floor(camera.x + bounds.x * camera.zoom) - 2),
    );
    const y = Math.max(
        0,
        Math.min(height, Math.floor(camera.y + bounds.y * camera.zoom) - 2),
    );
    const right = Math.min(
        width,
        Math.ceil(camera.x + (bounds.x + bounds.width) * camera.zoom) + 2,
    );
    const bottom = Math.min(
        height,
        Math.ceil(camera.y + (bounds.y + bounds.height) * camera.zoom) + 2,
    );
    return {
        x,
        y,
        width: Math.max(0, right - x),
        height: Math.max(0, bottom - y),
    };
}
