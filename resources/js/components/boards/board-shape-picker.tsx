// Summary: Provides a visual native-shape picker, using shared Board tool buttons and menu focus rules so keyboard placement stays available.

import { useRef } from 'react';
import { Shapes } from 'lucide-react';
import * as Menu from '@/components/ui/dropdown-menu';
import { BoardToolButton } from './board-tool-button';
import { boardBlockLabels } from './board-block-data';
import {
    boardInsertShapeKinds,
    boardShapePath,
    isBoardShapeTool,
} from './board-shape-data';
import type { BoardShapeKind, BoardTool } from './board-types';

export function BoardShapePicker({
    tool,
    disabled,
    open,
    onOpenChange,
    onChoose,
}: {
    tool: BoardTool;
    disabled: boolean;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onChoose: (tool: BoardShapeKind) => void;
}) {
    const chosen = useRef(false);
    return (
        <Menu.Root
            modal={false}
            open={open && !disabled}
            onOpenChange={(nextOpen) => {
                if (nextOpen) chosen.current = false;
                onOpenChange(nextOpen);
            }}
        >
            <Menu.Trigger asChild>
                <BoardToolButton
                    label="Shapes"
                    icon={Shapes}
                    tooltipSide="right"
                    disabled={disabled}
                    aria-pressed={isBoardShapeTool(tool)}
                />
            </Menu.Trigger>
            <Menu.Content
                className="board-shape-picker"
                side="right"
                align="center"
                sideOffset={10}
                collisionPadding={12}
                onCloseAutoFocus={(event) => {
                    //
                    // Tool selection focuses the canvas; the menu must not take that focus back.
                    //
                    if (chosen.current) event.preventDefault();
                }}
            >
                <Menu.Label>Shapes</Menu.Label>
                {boardInsertShapeKinds.map((kind) => (
                    <Menu.Item
                        key={kind}
                        disabled={disabled}
                        aria-current={tool === kind ? 'true' : undefined}
                        onSelect={() => {
                            chosen.current = true;
                            onChoose(kind);
                        }}
                    >
                        <svg
                            className="board-shape-sample"
                            viewBox="-8 -8 116 116"
                            aria-hidden="true"
                        >
                            <path
                                d={boardShapePath(kind)}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="7"
                                strokeLinejoin="round"
                            />
                        </svg>
                        {boardBlockLabels[kind]}
                    </Menu.Item>
                ))}
                <Menu.Separator />
                <Menu.Label>Drag to size · Shift for equal sides</Menu.Label>
            </Menu.Content>
        </Menu.Root>
    );
}
