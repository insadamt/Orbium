import { Check, Undo2, X } from 'lucide-react';
import { BoardToolButton } from './board-tool-button';
import type { BoardDrawingController } from './use-board-drawing';

export function BoardPathControls({
    drawing,
    disabled,
}: {
    drawing: BoardDrawingController;
    disabled: boolean;
}) {
    return (
        <div
            className="board-path-actions"
            role="group"
            aria-label="Path Pen actions"
        >
            <BoardToolButton
                label="Finish path"
                shortcut="Enter or double-click"
                icon={Check}
                disabled={disabled || drawing.path.pointCount < 2}
                onClick={drawing.path.finish}
            >
                Finish
            </BoardToolButton>
            <BoardToolButton
                label="Remove last point"
                shortcut="Backspace"
                icon={Undo2}
                disabled={disabled || !drawing.path.pointCount}
                onClick={drawing.path.removeLastPoint}
            />
            <BoardToolButton
                label="Cancel unfinished path"
                shortcut="Esc"
                icon={X}
                disabled={disabled || !drawing.path.pointCount}
                onClick={drawing.path.cancel}
            />
        </div>
    );
}
