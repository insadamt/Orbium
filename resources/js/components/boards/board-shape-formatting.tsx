// Summary: Edits saved shape appearance through existing Board history callbacks, depending on shared color menus and bounded outline presets.

import * as Menu from '@/components/ui/dropdown-menu';
import { TextColorMenu } from '@/components/editor/ui/text-color-menu';
import { BoardToolButton } from './board-tool-button';
import { BoardTextLayoutControls } from './board-text-layout-controls';
import type { BoardObject, BoardShape } from './board-types';

export function BoardShapeFormatting({
    object,
    disabled,
    onChange,
}: {
    object: BoardObject;
    disabled: boolean;
    onChange: (object: BoardObject) => void;
}) {
    const shape = object.data.shape!;
    function applyAppearance(change: Partial<BoardShape>) {
        if (disabled) return;
        const nextShape = { ...shape, ...change };
        if (JSON.stringify(nextShape) === JSON.stringify(shape)) return;
        onChange({ ...object, data: { ...object.data, shape: nextShape } });
    }
    return (
        <div
            className="board-toolbar-group board-shape-formatting"
            role="group"
            aria-label="Shape appearance"
        >
            <div inert={disabled}>
                <TextColorMenu
                    active={!disabled}
                    colorLabel="Shape fill"
                    presetColorFormat="hex"
                    currentColor={
                        shape.fill.startsWith('#') ? shape.fill : undefined
                    }
                    onOpen={() => {}}
                    onChoose={(color) =>
                        applyAppearance({ fill: color ?? 'none' })
                    }
                />
            </div>
            <BoardToolButton
                label="Transparent fill"
                disabled={disabled}
                aria-pressed={shape.fill === 'none'}
                onClick={() => applyAppearance({ fill: 'none' })}
            >
                No fill
            </BoardToolButton>
            <div inert={disabled}>
                <TextColorMenu
                    active={!disabled}
                    colorLabel="Shape outline color"
                    presetColorFormat="hex"
                    currentColor={
                        shape.stroke === 'currentColor'
                            ? undefined
                            : shape.stroke
                    }
                    onOpen={() => {}}
                    onChoose={(color) =>
                        applyAppearance({ stroke: color ?? 'currentColor' })
                    }
                />
            </div>
            <Menu.Root modal={false}>
                <Menu.Trigger asChild>
                    <BoardToolButton
                        label="Shape outline width and style"
                        disabled={disabled}
                    >
                        {shape.stroke_width} px · {shape.stroke_style}
                    </BoardToolButton>
                </Menu.Trigger>
                <Menu.Content
                    align="start"
                    sideOffset={10}
                    collisionPadding={12}
                >
                    <Menu.Label>Outline width</Menu.Label>
                    <Menu.RadioGroup
                        value={String(shape.stroke_width)}
                        onValueChange={(value) =>
                            applyAppearance({ stroke_width: Number(value) })
                        }
                    >
                        {[1, 2, 3, 4, 6, 8, 12].map((width) => (
                            <Menu.RadioItem
                                key={width}
                                value={String(width)}
                                disabled={disabled}
                            >
                                {width} px
                            </Menu.RadioItem>
                        ))}
                    </Menu.RadioGroup>
                    <Menu.Separator />
                    <Menu.Label>Outline style</Menu.Label>
                    <Menu.RadioGroup
                        value={shape.stroke_style}
                        onValueChange={(value) =>
                            applyAppearance({
                                stroke_style: value as 'solid' | 'dashed',
                            })
                        }
                    >
                        <Menu.RadioItem value="solid" disabled={disabled}>
                            Solid
                        </Menu.RadioItem>
                        <Menu.RadioItem value="dashed" disabled={disabled}>
                            Dashed
                        </Menu.RadioItem>
                    </Menu.RadioGroup>
                </Menu.Content>
            </Menu.Root>
            <BoardTextLayoutControls
                data={object.data}
                disabled={disabled}
                onChange={(data) => onChange({ ...object, data })}
            />
        </div>
    );
}
