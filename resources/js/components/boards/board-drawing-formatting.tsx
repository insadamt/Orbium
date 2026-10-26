import { ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { TextColorMenu } from '@/components/editor/ui/text-color-menu';
import * as Menu from '@/components/ui/dropdown-menu';
import { BoardToolButton } from './board-tool-button';
import {
    createRestyledBoardDrawing,
    type BoardDrawingStyleChange,
} from './board-drawing-restyle';
import type { BoardObject } from './board-types';

const strokeWidths = [1, 3, 4, 6, 12, 24, 48];

export function BoardDrawingFormatting({
    object,
    disabled,
    onChange,
    onFocusCanvas,
}: {
    object: BoardObject;
    disabled: boolean;
    onChange: (object: BoardObject) => void;
    onFocusCanvas: () => void;
}) {
    const drawing = object.data.drawing;
    if (!drawing) return null;
    function applyStyle(change: BoardDrawingStyleChange) {
        if (disabled) return;
        const replacement = createRestyledBoardDrawing(object, change);
        if (!replacement) {
            toast.info(
                'This width exceeds the drawing bounds. Resize it or choose a smaller width.',
            );
            return;
        }
        if (replacement !== object) onChange(replacement);
    }
    const widths = strokeWidths.includes(drawing.stroke_width)
        ? strokeWidths
        : [...strokeWidths, drawing.stroke_width].sort((a, b) => a - b);
    return (
        <div
            className="board-toolbar-group board-drawing-formatting"
            role="group"
            aria-label="Drawing style"
        >
            <div inert={disabled}>
                <TextColorMenu
                    active={!disabled}
                    colorLabel="Drawing color"
                    presetColorFormat="hex"
                    currentColor={
                        drawing.color === 'currentColor'
                            ? undefined
                            : drawing.color
                    }
                    onOpen={() => {}}
                    onClose={onFocusCanvas}
                    onChoose={(color) =>
                        applyStyle({ color: color ?? 'currentColor' })
                    }
                />
            </div>
            <Menu.Root modal={false}>
                <Menu.Trigger asChild>
                    <BoardToolButton label="Drawing width" disabled={disabled}>
                        <span
                            className="board-drawing-width-sample"
                            aria-hidden="true"
                            style={{
                                height: Math.min(8, drawing.stroke_width),
                            }}
                        />
                        <span>{drawing.stroke_width} px</span>
                        <ChevronDown size={12} aria-hidden="true" />
                    </BoardToolButton>
                </Menu.Trigger>
                <Menu.Content
                    className="board-drawing-width-menu"
                    align="start"
                    sideOffset={10}
                    collisionPadding={12}
                >
                    <Menu.Label>Stroke width</Menu.Label>
                    <Menu.RadioGroup
                        value={String(drawing.stroke_width)}
                        onValueChange={(value) =>
                            applyStyle({ strokeWidth: Number(value) })
                        }
                    >
                        {widths.map((width) => (
                            <Menu.RadioItem
                                key={width}
                                value={String(width)}
                                disabled={disabled}
                            >
                                <span
                                    className="board-drawing-width-sample"
                                    aria-hidden="true"
                                    style={{ height: Math.min(8, width) }}
                                />
                                {width} px
                            </Menu.RadioItem>
                        ))}
                    </Menu.RadioGroup>
                </Menu.Content>
            </Menu.Root>
        </div>
    );
}
