import { BoardBrushPreview } from './board-brush-preview';
import { BoardToolButton } from './board-tool-button';
import { BoardToolbarHighlight } from './board-toolbar-highlight';
import { isBoardDrawingTool } from './board-drawing-data';
import { BoardDrawingStyleControls } from './board-drawing-style-controls';
import type { BoardTool } from './board-types';
import type { BoardDrawingController } from './use-board-drawing';

const drawingTools = [
    { tool: 'pen', label: 'Pen' },
    { tool: 'highlighter', label: 'Highlighter' },
    { tool: 'eraser', label: 'Eraser' },
] as const;

export function BoardDrawingControls({
    tool,
    drawing,
    disabled,
    onChooseTool,
}: {
    tool: BoardTool;
    drawing: BoardDrawingController;
    disabled: boolean;
    onChooseTool: (tool: BoardTool) => void;
}) {
    return (
        <div
            className="board-drawing-controls board-panel glass-surface"
            hidden={!isBoardDrawingTool(tool)}
            role="region"
            aria-label="Drawing tools"
            data-board-interactive
            data-tool={tool}
        >
            <div
                className="board-drawing-tools"
                role="group"
                aria-label="Drawing tool"
            >
                <BoardToolbarHighlight />
                {drawingTools.map((option) => (
                    <BoardToolButton
                        key={option.tool}
                        label={
                            option.tool === 'eraser'
                                ? 'Erase whole strokes'
                                : option.label
                        }
                        aria-pressed={tool === option.tool}
                        disabled={disabled}
                        onClick={() => onChooseTool(option.tool)}
                    >
                        <BoardBrushPreview
                            tool={option.tool}
                            color={drawing.brush.color}
                        />
                        <span>{option.label}</span>
                    </BoardToolButton>
                ))}
            </div>
            {tool !== 'eraser' && (
                <BoardDrawingStyleControls
                    drawing={drawing}
                    highlighter={tool === 'highlighter'}
                    disabled={disabled}
                />
            )}
        </div>
    );
}
