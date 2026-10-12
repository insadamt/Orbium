import type { TreeNode } from '@/components/navigation/navigation-types';

export type OrbingLink = { sourceId: number; targetId: number };

export type WorldPoint = { x: number; y: number };
export type ViewportSize = { width: number; height: number };
export type OrbingCamera = WorldPoint & { zoom: number };
export type WorldBounds = WorldPoint & { width: number; height: number };
export type OrbingEntity = WorldPoint & {
    node: TreeNode;
    depth: number;
    scale: number;
    footprint: number;
    childCount: number;
    childDistance: number;
    orbitAngle: number;
    orbitSpeed: number;
};
export const minimumZoom = 0.002;
export const maximumZoom = 64;

export function clampZoom(zoom: number) {
    return Math.min(maximumZoom, Math.max(minimumZoom, zoom));
}

export function fitOrbingSpace(
    bounds: WorldBounds,
    size: ViewportSize,
): OrbingCamera {
    return {
        x: bounds.x,
        y: bounds.y,
        zoom: clampZoom(
            Math.min(
                Math.max(100, size.width - 160) / bounds.width,
                Math.max(100, size.height - 160) / bounds.height,
            ),
        ),
    };
}

export function projectWorldPoint(
    point: WorldPoint,
    camera: OrbingCamera,
    size: ViewportSize,
): WorldPoint {
    return {
        x: size.width / 2 + (point.x - camera.x) * camera.zoom,
        y: size.height / 2 + (point.y - camera.y) * camera.zoom,
    };
}

export function zoomOrbingAt(
    camera: OrbingCamera,
    point: WorldPoint,
    size: ViewportSize,
    factor: number,
): OrbingCamera {
    const zoom = clampZoom(camera.zoom * factor);
    const deltaX = point.x - size.width / 2;
    const deltaY = point.y - size.height / 2;
    return {
        x: camera.x + deltaX / camera.zoom - deltaX / zoom,
        y: camera.y + deltaY / camera.zoom - deltaY / zoom,
        zoom,
    };
}
