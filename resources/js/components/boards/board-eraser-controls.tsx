import { BoardToolButton } from './board-tool-button';
import type { BoardDrawingController } from './use-board-drawing';

const eraserSizes = [
    [8, 'Fine'],
    [16, 'Regular'],
    [32, 'Broad'],
    [64, 'Large'],
] as const;

export function BoardEraserControls({
    drawing,
    disabled,
}: {
    drawing: BoardDrawingController;
    disabled: boolean;
}) {
    return (
        <div
            className="board-drawing-field"
            role="group"
            aria-label="Eraser size"
        >
            <span className="board-drawing-field-label">
                Size <span>{drawing.eraserSize} px</span>
            </span>
            <div className="board-drawing-widths">
                {eraserSizes.map(([size, label]) => (
                    <BoardToolButton
                        key={size}
                        label={`${label} eraser · ${size} px`}
                        aria-pressed={drawing.eraserSize === size}
                        disabled={disabled}
                        onClick={() => drawing.setEraserSize(size)}
                    >
                        <span
                            className="board-eraser-size-sample"
                            style={{
                                width: 5 + size / 4,
                                height: 5 + size / 4,
                            }}
                        />
                    </BoardToolButton>
                ))}
            </div>
        </div>
    );
}
