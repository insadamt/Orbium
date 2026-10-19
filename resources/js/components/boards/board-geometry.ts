import {
    boardLimits,
    type BoardBounds,
    type BoardCamera,
    type BoardPoint,
} from './board-types';

export function clamp(value: number, minimum: number, maximum: number) {
    return Math.max(minimum, Math.min(maximum, value));
}

export function canvasPoint(
    point: BoardPoint,
    camera: BoardCamera,
): BoardPoint {
    return {
        x: (point.x - camera.x) / camera.zoom,
        y: (point.y - camera.y) / camera.zoom,
    };
}

export function zoomAroundPoint(
    camera: BoardCamera,
    point: BoardPoint,
    zoom: number,
): BoardCamera {
    const nextZoom = clamp(zoom, boardLimits.minZoom, boardLimits.maxZoom);
    const anchor = canvasPoint(point, camera);
    return {
        x: point.x - anchor.x * nextZoom,
        y: point.y - anchor.y * nextZoom,
        zoom: nextZoom,
    };
}

export function enclosingBounds(objects: BoardBounds[]): BoardBounds | null {
    if (!objects.length) return null;
    const x = Math.min(...objects.map((object) => object.x));
    const y = Math.min(...objects.map((object) => object.y));
    return {
        x,
        y,
        width:
            Math.max(...objects.map((object) => object.x + object.width)) - x,
        height:
            Math.max(...objects.map((object) => object.y + object.height)) - y,
    };
}

export function intersects(first: BoardBounds, second: BoardBounds) {
    return (
        first.x <= second.x + second.width &&
        first.x + first.width >= second.x &&
        first.y <= second.y + second.height &&
        first.y + first.height >= second.y
    );
}

export function snapped(value: number, enabled: boolean) {
    return enabled ? Math.round(value / 16) * 16 : value;
}

export function pinchGeometry(points: BoardPoint[]) {
    const [first, second] = points;
    return {
        midpoint: { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 },
        distance: Math.max(
            1,
            Math.hypot(second.x - first.x, second.y - first.y),
        ),
    };
}
