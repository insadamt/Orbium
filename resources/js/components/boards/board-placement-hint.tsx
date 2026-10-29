// Summary: Explains the active Board placement gesture, depending on native block labels and shape-tool detection.

import { boardBlockLabels } from './board-block-data';
import { isBoardShapeTool } from './board-shape-data';
import type { BoardPlacementKind } from './board-types';

export function BoardPlacementHint({
    kind,
    onCancel,
}: {
    kind: BoardPlacementKind | null;
    onCancel: () => void;
}) {
    if (!kind) return null;
    return (
        <div
            className="board-placement-hint board-panel glass-surface"
            role="status"
        >
            <span>
                {isBoardShapeTool(kind)
                    ? 'Drag to size or click to place'
                    : 'Click to place'}{' '}
                {boardBlockLabels[kind].toLowerCase()} ·{' '}
                {isBoardShapeTool(kind) ? 'Shift for equal sides · ' : ''}Enter
                for center
            </span>
            <button
                type="button"
                onClick={onCancel}
                aria-label="Cancel placement"
            >
                Cancel <kbd>Esc</kbd>
            </button>
        </div>
    );
}
