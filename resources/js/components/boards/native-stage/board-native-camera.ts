// Summary: Applies navigation directly to the Stage transform so graphics and future overlays share one camera; depends on Konva and existing Board zoom limits.

import type Konva from 'konva';
import { clamp, enclosingBounds, zoomAroundPoint } from '../board-geometry';
import { boardLimits, type BoardBounds, type BoardPoint } from '../board-types';

export function createNativeBoardCamera(stage: Konva.Stage) {
    const read = () => ({ x: stage.x(), y: stage.y(), zoom: stage.scaleX() });

    function apply(camera: ReturnType<typeof read>) {
        if (![camera.x, camera.y, camera.zoom].every(Number.isFinite)) return;
        const zoom = clamp(
            camera.zoom,
            boardLimits.minZoom,
            boardLimits.maxZoom,
        );
        stage.setAttrs({
            x: clamp(camera.x, -40_000_000, 40_000_000),
            y: clamp(camera.y, -40_000_000, 40_000_000),
            scaleX: zoom,
            scaleY: zoom,
        });
    }

    function zoomAt(point: BoardPoint, zoom: number) {
        apply(zoomAroundPoint(read(), point, zoom));
    }

    return {
        read,
        apply,
        zoomAt,
        worldPoint: (point: BoardPoint) =>
            stage.getAbsoluteTransform().copy().invert().point(point),
        zoomBy: (factor: number) =>
            zoomAt(
                { x: stage.width() / 2, y: stage.height() / 2 },
                stage.scaleX() * factor,
            ),
        reset: () => apply({ x: 0, y: 0, zoom: 1 }),
        fit(objects: BoardBounds[]) {
            const bounds = enclosingBounds(objects);
            if (!bounds) {
                apply({ x: 0, y: 0, zoom: 1 });
                return;
            }
            const zoom = clamp(
                Math.min(
                    Math.max(80, stage.width() - 96) /
                        Math.max(1, bounds.width),
                    Math.max(80, stage.height() - 160) /
                        Math.max(1, bounds.height),
                ),
                boardLimits.minZoom,
                Math.min(1.5, boardLimits.maxZoom),
            );
            apply({
                zoom,
                x: stage.width() / 2 - (bounds.x + bounds.width / 2) * zoom,
                y: stage.height() / 2 - (bounds.y + bounds.height / 2) * zoom,
            });
        },
    };
}

export type NativeBoardCamera = ReturnType<typeof createNativeBoardCamera>;
