import { clamp } from './board-geometry';
import { boardLimits, type BoardPoint, type BoardObject } from './board-types';
export function resourceObjectGeometry(
    point: BoardPoint,
    id = crypto.randomUUID(),
) {
    return {
        id,
        x: clamp(
            point.x - 300,
            -boardLimits.coordinate,
            boardLimits.coordinate,
        ),
        y: clamp(
            point.y - 180,
            -boardLimits.coordinate,
            boardLimits.coordinate,
        ),
        width: 600,
        height: 420,
    };
}
export function createResourceObject(
    point: BoardPoint,
    targetId: number,
    layer: number,
): BoardObject {
    return {
        ...resourceObjectGeometry(point),
        block_type: 'resource',
        content_format_version: 1,
        data: { target_node_id: targetId },
        layer,
    };
}
