import { BoardPathControls } from './board-path-controls';
import { BoardEraserControls } from './board-eraser-controls';
import { BoardBrushPreview } from './board-brush-preview';
import { BoardToolButton } from './board-tool-button';
import { BoardToolbarHighlight } from './board-toolbar-highlight';
import { isBoardDrawingTool } from './board-drawing-data';
import { BoardDrawingStyleControls } from './board-drawing-style-controls';
import type { BoardTool } from './board-types';
import type { BoardDrawingController } from './use-board-drawing';

const drawingTools = [
    { tool: 'pen', label: 'Pen' },
    { tool: 'path', label: 'Path Pen' },
    { tool: 'highlighter', label: 'Highlighter' },
    { tool: 'eraser', label: 'Eraser' },
] as const;

export function BoardDrawingControls({
    tool,
    settingsOpen,
    drawing,
    disabled,
    skipExitAnimation,
    onChooseTool,
}: {
    tool: BoardTool;
    settingsOpen: boolean;
    drawing: BoardDrawingController;
    disabled: boolean;
    skipExitAnimation: boolean;
    onChooseTool: (tool: BoardTool) => void;
}) {
    return (
        <div
            className="board-drawing-controls board-panel glass-surface"
            hidden={!isBoardDrawingTool(tool) || !settingsOpen}
            role="region"
            aria-label="Drawing tools"
            data-board-interactive
            data-tool={tool}
            data-switching={skipExitAnimation ? 'true' : undefined}
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
                                ? 'Erase parts of strokes'
                                : option.label
                        }
                        tooltipSide="right"
                        shortcut={
                            option.tool === 'path'
                                ? 'Enter to finish'
                                : undefined
                        }
                        aria-pressed={tool === option.tool}
                        disabled={disabled}
                        onClick={() => {
                            if (tool !== option.tool) onChooseTool(option.tool);
                        }}
                    >
                        <BoardBrushPreview
                            tool={option.tool}
                            color={drawing.brush.color}
                        />
                        <span>{option.label}</span>
                    </BoardToolButton>
                ))}
            </div>
            {tool === 'eraser' ? (
                <BoardEraserControls drawing={drawing} disabled={disabled} />
            ) : (
                <BoardDrawingStyleControls
                    drawing={drawing}
                    smoothingEnabled={tool !== 'path'}
                    highlighter={tool === 'highlighter'}
                    disabled={disabled}
                />
            )}
            {tool === 'path' && (
                <BoardPathControls drawing={drawing} disabled={disabled} />
            )}
        </div>
    );
}
