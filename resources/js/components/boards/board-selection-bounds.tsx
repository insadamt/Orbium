import { enclosingBounds } from './board-geometry';
import type { BoardObject } from './board-types';

export function BoardSelectionBounds({
    objects,
    selectedIds,
}: {
    objects: BoardObject[];
    selectedIds: string[];
}) {
    if (selectedIds.length < 2) return null;
    const bounds = enclosingBounds(
        objects.filter((object) => selectedIds.includes(object.id)),
    );
    if (!bounds) return null;
    return (
        <div
            className="board-multi-selection"
            data-board-multi-selection
            style={{
                left: bounds.x,
                top: bounds.y,
                width: bounds.width,
                height: bounds.height,
            }}
        >
            {['top', 'right', 'bottom', 'left'].map((edge) => (
                <span
                    key={edge}
                    data-board-selection-drag
                    className={`board-selection-edge board-selection-edge-${edge}`}
                />
            ))}
        </div>
    );
}
