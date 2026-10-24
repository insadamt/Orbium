import type { BoardCamera } from '../board-types';
import type { BoardRendererMode } from './board-renderer-mode';

export function paintBoardCameraSurface({
    world,
    camera,
    mode,
    settleDensity = false,
}: {
    world: HTMLDivElement;
    camera: BoardCamera;
    mode: BoardRendererMode;
    settleDensity?: boolean;
}) {
    const { x, y, zoom } = camera;
    const style = world.style;
    const previousDensity = Number(style.zoom) || zoom;
    const density =
        mode === 'original' || settleDensity ? zoom : previousDensity;
    //
    // Keep layout density fixed during Instant Scene gestures, then commit sharp native layout in one synchronous style update.
    //
    if (style.zoom !== String(density)) style.zoom = String(density);
    const translation = `${x / density}px ${y / density}px`;
    if (style.translate !== translation) style.translate = translation;
    if (mode === 'instant') {
        const scale = String(zoom / density);
        if (style.scale !== scale) style.scale = scale;
        style.transformOrigin = '0 0';
    }
}
