// Summary: Provides creation, history and view controls; depends on Board tool selection, visual pickers and camera actions.

import { BoardShapePicker } from './board-shape-picker';
import { isBoardDrawingTool } from './board-drawing-data';
import {
    Type,
    Pencil,
    MousePointer2,
    Hand,
    Undo2,
    Redo2,
    Scan,
    Focus,
    Minus,
    Plus,
    Grid2X2,
    Magnet,
    CircleHelp,
    SlidersHorizontal,
    ScanLine,
} from 'lucide-react';
import * as Menu from '@/components/ui/dropdown-menu';
import type { BoardTool } from './board-types';
import type { BoardObjectsController } from './use-board-objects';
import type { BoardCameraController } from './use-board-camera';
import { BoardBlockPicker } from './board-block-picker';
import { BoardToolbarHighlight } from './board-toolbar-highlight';
import { BoardToolButton } from './board-tool-button';

export function BoardToolbar({
    model,
    camera,
    blocked,
    editing,
    tool,
    onChooseTool,
    drawingSettingsOpen,
    onToggleDrawingSettings,
    onResource,
    onHelp,
    onUndo,
    onRedo,
}: {
    model: BoardObjectsController;
    camera: BoardCameraController;
    blocked: boolean;
    editing: boolean;
    tool: BoardTool;
    drawingSettingsOpen: boolean;
    onToggleDrawingSettings: () => void;
    onChooseTool: (tool: BoardTool) => void;
    onResource: () => void;
    onHelp: () => void;
    onUndo: () => void;
    onRedo: () => void;
}) {
    const selected = model.objects.filter((object) =>
        model.selectedIds.includes(object.id),
    );
    return (
        <>
            <div
                className="board-creation-dock board-panel glass-surface"
                role="group"
                aria-label="Create on board"
            >
                <BoardToolbarHighlight />
                <BoardToolButton
                    label="Select objects"
                    tooltipSide="right"
                    disabledReason={
                        editing ? 'Finish editing to switch tools.' : undefined
                    }
                    icon={MousePointer2}
                    disabled={blocked || editing}
                    aria-pressed={tool === 'select'}
                    onClick={() => onChooseTool('select')}
                />
                <BoardToolButton
                    label="Hand — pan the canvas"
                    tooltipSide="right"
                    disabledReason={
                        editing ? 'Finish editing to switch tools.' : undefined
                    }
                    icon={Hand}
                    disabled={blocked || editing}
                    aria-pressed={tool === 'hand'}
                    onClick={() => onChooseTool('hand')}
                />
                <span className="board-tool-separator" />
                <BoardToolButton
                    label="Place text"
                    tooltipSide="right"
                    disabledReason={
                        editing ? 'Finish editing to switch tools.' : undefined
                    }
                    icon={Type}
                    disabled={blocked || editing}
                    aria-pressed={tool === 'text'}
                    onClick={() => onChooseTool('text')}
                />
                <BoardToolButton
                    label={
                        isBoardDrawingTool(tool)
                            ? drawingSettingsOpen
                                ? 'Hide drawing settings'
                                : 'Show drawing settings'
                            : 'Draw on board'
                    }
                    tooltipSide="right"
                    icon={Pencil}
                    disabled={blocked || editing}
                    disabledReason={
                        editing ? 'Finish editing to draw.' : undefined
                    }
                    aria-pressed={isBoardDrawingTool(tool)}
                    aria-expanded={
                        isBoardDrawingTool(tool) && drawingSettingsOpen
                    }
                    onClick={onToggleDrawingSettings}
                />
                <BoardShapePicker
                    tool={tool}
                    disabled={blocked || editing}
                    onChoose={onChooseTool}
                />
                <BoardBlockPicker
                    disabled={blocked || editing}
                    disabledReason={
                        editing ? 'Finish editing to add blocks.' : undefined
                    }
                    tool={tool}
                    onResource={onResource}
                    onAdd={onChooseTool}
                />
                <div
                    className="board-history-controls"
                    role="group"
                    aria-label="Board history"
                    onMouseDown={(event) => event.preventDefault()}
                >
                    <BoardToolButton
                        label="Undo"
                        shortcut="Ctrl/Cmd+Z"
                        tooltipSide="right"
                        icon={Undo2}
                        disabled={!model.canUndo || blocked}
                        onClick={onUndo}
                    />
                    <BoardToolButton
                        label="Redo"
                        shortcut="Ctrl/Cmd+Shift+Z"
                        tooltipSide="right"
                        icon={Redo2}
                        disabled={!model.canRedo || blocked}
                        onClick={onRedo}
                    />
                </div>
            </div>
            <div
                className="board-navigation-dock board-panel glass-surface"
                role="group"
                aria-label="Canvas view"
            >
                <BoardToolButton
                    label="Zoom out"
                    icon={Minus}
                    onClick={() => camera.zoomBy(0.8)}
                />
                <BoardToolButton
                    label="Reset view to 100%"
                    data-zoom-reset
                    onClick={camera.reset}
                >
                    <span
                        ref={camera.zoomLabelRef}
                        className="board-zoom-label"
                    >
                        100%
                    </span>
                </BoardToolButton>
                <BoardToolButton
                    label="Zoom in"
                    icon={Plus}
                    onClick={() => camera.zoomBy(1.25)}
                />
                <span className="board-tool-separator" />
                <Menu.Root modal={false}>
                    <Menu.Trigger asChild>
                        <BoardToolButton
                            label="View options"
                            icon={SlidersHorizontal}
                        />
                    </Menu.Trigger>
                    <Menu.Content
                        className="board-view-menu"
                        side="top"
                        align="end"
                        sideOffset={12}
                        collisionPadding={12}
                    >
                        <Menu.Label>Canvas view</Menu.Label>
                        <Menu.Item onSelect={() => camera.fit(model.objects)}>
                            <Scan /> Fit all blocks
                        </Menu.Item>
                        <Menu.Item
                            disabled={!selected.length}
                            onSelect={() => camera.fit(selected)}
                        >
                            <Focus /> Fit selection
                        </Menu.Item>
                        <Menu.Separator />
                        <Menu.CheckboxItem
                            checked={camera.grid}
                            onCheckedChange={camera.toggleGrid}
                        >
                            <Grid2X2 /> Dot grid
                        </Menu.CheckboxItem>
                        <Menu.CheckboxItem
                            checked={camera.snap}
                            onCheckedChange={camera.toggleSnap}
                        >
                            <Magnet /> Snap to grid
                        </Menu.CheckboxItem>
                        <Menu.CheckboxItem
                            checked={camera.guides}
                            onCheckedChange={camera.toggleGuides}
                        >
                            <ScanLine /> Smart alignment guides
                        </Menu.CheckboxItem>
                        <Menu.Separator />
                        <Menu.Item onSelect={onHelp}>
                            <CircleHelp /> Canvas controls
                        </Menu.Item>
                    </Menu.Content>
                </Menu.Root>
            </div>
        </>
    );
}
