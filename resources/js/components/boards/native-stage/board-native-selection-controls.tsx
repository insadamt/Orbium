// Summary: Reuses existing shape and drawing appearance controls for scratch selections; depends on immutable selected records and completed history actions, while rich label editing remains at the HTML gate.

import { ArrowDownToLine, ArrowUpToLine } from 'lucide-react';
import { BoardDrawingFormatting } from '../board-drawing-formatting';
import { BoardShapeFormatting } from '../board-shape-formatting';
import { BoardToolButton } from '../board-tool-button';
import type { BoardObject } from '../board-types';

export function BoardNativeSelectionControls({
    object,
    onChange,
    onLayer,
    onFocusCanvas,
}: {
    object: BoardObject | null;
    onChange: (object: BoardObject) => void;
    onLayer: (direction: 'front' | 'back') => void;
    onFocusCanvas: () => void;
}) {
    if (!object) return null;
    return (
        <div
            className="board-native-selection-controls board-panel"
            role="toolbar"
            aria-label="Selected graphic formatting"
        >
            {object.block_type === 'shape' ? (
                <BoardShapeFormatting
                    object={object}
                    disabled={false}
                    onChange={onChange}
                    showTextLayout={false}
                />
            ) : (
                <BoardDrawingFormatting
                    object={object}
                    disabled={false}
                    onChange={onChange}
                    onFocusCanvas={onFocusCanvas}
                />
            )}
            <BoardToolButton
                label="Bring graphic to front"
                icon={ArrowUpToLine}
                onClick={() => onLayer('front')}
            />
            <BoardToolButton
                label="Send graphic to back"
                icon={ArrowDownToLine}
                onClick={() => onLayer('back')}
            />
        </div>
    );
}
