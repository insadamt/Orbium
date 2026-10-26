import { Check } from 'lucide-react';
import { AppSelect } from '@/components/ui/app-select';
import { BoardToolButton } from './board-tool-button';
import type { BoardDrawingController } from './use-board-drawing';
import type { BoardDrawingSmoothing } from './board-drawing-smoothing';

const colors = [
    ['currentColor', 'Theme'],
    ['#ef4444', 'Red'],
    ['#f59e0b', 'Amber'],
    ['#10b981', 'Green'],
    ['#3b82f6', 'Blue'],
    ['#a855f7', 'Purple'],
] as const;
const widths = [
    [1, 'Fine'],
    [3, 'Regular'],
    [6, 'Bold'],
    [12, 'Broad'],
] as const;
const smoothingOptions: { value: BoardDrawingSmoothing; label: string }[] = [
    { value: 'off', label: 'Off' },
    { value: 'light', label: 'Light' },
    { value: 'strong', label: 'Strong' },
];

export function BoardDrawingStyleControls({
    drawing,
    highlighter,
    disabled,
    smoothingEnabled = true,
}: {
    drawing: BoardDrawingController;
    highlighter: boolean;
    disabled: boolean;
    smoothingEnabled?: boolean;
}) {
    const strokeWidth = drawing.brush.width * (highlighter ? 4 : 1);
    return (
        <>
            <div className="board-drawing-style-row">
                <div
                    className="board-drawing-field"
                    role="group"
                    aria-label="Stroke color"
                >
                    <div className="board-drawing-swatches">
                        {colors.map(([color, label]) => (
                            <BoardToolButton
                                key={color}
                                label={`${label} ink${color === 'currentColor' ? ' — follows appearance' : ''}`}
                                className="board-tool-button editor-toolbar-button board-drawing-color"
                                aria-pressed={drawing.brush.color === color}
                                disabled={disabled}
                                onClick={() =>
                                    drawing.setBrush({
                                        ...drawing.brush,
                                        color,
                                    })
                                }
                            >
                                <span
                                    className="board-drawing-swatch"
                                    data-theme={color === 'currentColor'}
                                    style={{ backgroundColor: color }}
                                >
                                    {drawing.brush.color === color && (
                                        <Check size={11} aria-hidden="true" />
                                    )}
                                </span>
                            </BoardToolButton>
                        ))}
                    </div>
                </div>
                <div
                    className="board-drawing-field"
                    role="group"
                    aria-label="Stroke width"
                >
                    <span className="board-drawing-field-label">
                        Width <span>{strokeWidth} px</span>
                    </span>
                    <div className="board-drawing-widths">
                        {widths.map(([width, label]) => (
                            <BoardToolButton
                                key={width}
                                label={`${label} · ${width * (highlighter ? 4 : 1)} px`}
                                aria-pressed={drawing.brush.width === width}
                                disabled={disabled}
                                onClick={() =>
                                    drawing.setBrush({
                                        ...drawing.brush,
                                        width,
                                    })
                                }
                            >
                                <span
                                    className="board-drawing-width-sample"
                                    style={{
                                        height: width,
                                    }}
                                />
                            </BoardToolButton>
                        ))}
                    </div>
                </div>
            </div>
            {smoothingEnabled && (
                <div className="board-drawing-style-row board-drawing-smoothing-row">
                    <div className="board-drawing-field">
                        <span className="board-drawing-field-label">
                            Smoothing
                        </span>
                        <AppSelect
                            label="Drawing smoothing"
                            value={drawing.smoothing}
                            options={smoothingOptions}
                            disabled={disabled}
                            className="board-drawing-smoothing-select"
                            contentClassName="board-drawing-smoothing-menu"
                            onValueChange={(value) => {
                                const option = smoothingOptions.find(
                                    (option) => option.value === value,
                                );
                                if (option) drawing.setSmoothing(option.value);
                            }}
                        />
                    </div>
                </div>
            )}
        </>
    );
}
