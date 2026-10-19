import {
    Type,
    MousePointer2,
    Hand,
    Undo2,
    Redo2,
    Scan,
    Focus,
    RotateCcw,
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
import { BoardToolButton } from './board-tool-button';

export function BoardToolbar({
    model,
    camera,
    blocked,
    tool,
    onChooseTool,
    onResource,
    onHelp,
    onUndo,
    onRedo,
}: {
    model: BoardObjectsController;
    camera: BoardCameraController;
    blocked: boolean;
    tool: BoardTool;
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
                <BoardToolButton
                    label="Select objects"
                    icon={MousePointer2}
                    disabled={blocked}
                    aria-pressed={tool === 'select'}
                    onClick={() => onChooseTool('select')}
                >
                    <span className="board-dock-label">Select</span>
                </BoardToolButton>
                <BoardToolButton
                    label="Hand — pan the canvas"
                    icon={Hand}
                    disabled={blocked}
                    aria-pressed={tool === 'hand'}
                    onClick={() => onChooseTool('hand')}
                >
                    <span className="board-dock-label">Hand</span>
                </BoardToolButton>
                <span className="board-tool-separator" />
                <BoardToolButton
                    label="Place text"
                    icon={Type}
                    disabled={blocked}
                    aria-pressed={tool === 'text'}
                    onClick={() => onChooseTool('text')}
                >
                    <span className="board-dock-label">Text</span>
                </BoardToolButton>
                <BoardBlockPicker
                    disabled={blocked}
                    active={!['select', 'hand', 'text'].includes(tool)}
                    onResource={onResource}
                    onAdd={(kind) => {
                        if (kind !== 'resource') onChooseTool(kind);
                    }}
                />
                <span className="board-tool-separator" />
                <div
                    className="board-history-controls"
                    role="group"
                    aria-label="Board history"
                    onMouseDown={(event) => event.preventDefault()}
                >
                    <BoardToolButton
                        label="Undo (Ctrl/Cmd+Z)"
                        icon={Undo2}
                        disabled={!model.canUndo || blocked}
                        onClick={onUndo}
                    />
                    <BoardToolButton
                        label="Redo (Ctrl/Cmd+Shift+Z)"
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
                <span
                    ref={camera.zoomLabelRef}
                    className="board-zoom-label"
                    aria-label="Zoom"
                >
                    100%
                </span>
                <BoardToolButton
                    label="Zoom in"
                    icon={Plus}
                    onClick={() => camera.zoomBy(1.25)}
                />
                <span className="board-tool-separator" />
                <BoardToolButton
                    label="Fit all blocks"
                    icon={Scan}
                    onClick={() => camera.fit(model.objects)}
                />
                <Menu.Root modal={false}>
                    <Menu.Trigger asChild>
                        <button
                            type="button"
                            className="board-tool-button"
                            aria-label="View options"
                            title="View options"
                        >
                            <SlidersHorizontal size={17} aria-hidden="true" />
                        </button>
                    </Menu.Trigger>
                    <Menu.Content
                        side="top"
                        align="end"
                        sideOffset={12}
                        collisionPadding={12}
                    >
                        <Menu.Label>Canvas view</Menu.Label>
                        <Menu.Item
                            disabled={!selected.length}
                            onSelect={() => camera.fit(selected)}
                        >
                            <Focus /> Fit selection
                        </Menu.Item>
                        <Menu.Item onSelect={camera.reset}>
                            <RotateCcw /> Reset to 100%
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
