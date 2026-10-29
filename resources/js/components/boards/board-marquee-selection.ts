// Summary: Resolves the existing Board marquee into object IDs, depending on camera geometry so pointer orchestration stays readable.

import { canvasPoint, intersects } from './board-geometry';
import type { BoardCamera, BoardObject, BoardPoint } from './board-types';

export function boardMarqueeSelection({
    start,
    end,
    previous,
    camera,
    objects,
}: {
    start: BoardPoint;
    end: BoardPoint;
    previous: string[];
    camera: BoardCamera;
    objects: BoardObject[];
}) {
    const first = canvasPoint(start, camera);
    const last = canvasPoint(end, camera);
    const bounds = {
        x: Math.min(first.x, last.x),
        y: Math.min(first.y, last.y),
        width: Math.abs(first.x - last.x),
        height: Math.abs(first.y - last.y),
    };
    const matched =
        bounds.width > 2 && bounds.height > 2
            ? objects
                  .filter((object) => intersects(bounds, object))
                  .map((object) => object.id)
            : [];
    return [...new Set([...previous, ...matched])];
}
