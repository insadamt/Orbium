import { isBoardDrawingTool } from './board-drawing-data';
import { useState, type KeyboardEvent } from 'react';
import type { BoardObjectsController } from './use-board-objects';
import type { BoardCameraController } from './use-board-camera';
import type { BoardPlacementKind, BoardPoint, BoardTool } from './board-types';

export function useBoardTools({
    model,
    camera,
    isLocked,
}: {
    model: BoardObjectsController;
    camera: BoardCameraController;
    isLocked: () => boolean;
}) {
    const [tool, setTool] = useState<BoardTool>('select');
    const [drawingSettingsOpen, setDrawingSettingsOpen] = useState(false);
    const placementKind =
        tool === 'select' || tool === 'hand' || isBoardDrawingTool(tool)
            ? null
            : tool;
    const placing = placementKind !== null;

    function chooseTool(nextTool: BoardTool) {
        if (isLocked()) return;
        model.finishEditing();
        model.select([]);
        setTool(nextTool);
        setDrawingSettingsOpen(isBoardDrawingTool(nextTool));
        camera.viewportRef.current?.focus({ preventScroll: true });
    }
    function toggleDrawingSettings() {
        if (isLocked()) return;
        if (!isBoardDrawingTool(tool)) {
            chooseTool('pen');
            return;
        }
        //
        // Palette visibility is independent of the active brush so hiding settings preserves drawing mode.
        //
        setDrawingSettingsOpen((open) => !open);
        camera.viewportRef.current?.focus({ preventScroll: true });
    }
    function placeBlock(kind: BoardPlacementKind, point: BoardPoint) {
        if (isLocked()) return;
        const previousCount = model.objectsRef.current.length;
        model.addBlock(point, kind);
        if (model.objectsRef.current.length > previousCount) setTool('select');
    }
    function handleToolKeyboard(event: KeyboardEvent<HTMLDivElement>) {
        if (!event.currentTarget.contains(event.target as Node)) return true;
        if (
            (event.target as Element).closest(
                '[data-board-editor], [data-board-interactive], button, a, input, textarea, select, [contenteditable="true"]',
            )
        )
            return false;
        if (event.key === 'Enter' && placementKind) {
            event.preventDefault();
            placeBlock(placementKind, camera.centerPoint());
            return true;
        }
        if (tool !== 'select') {
            const modifier = event.ctrlKey || event.metaKey;
            if (modifier && ['z', 'y'].includes(event.key.toLowerCase()))
                return false;
            if (
                event.key.startsWith('Arrow') ||
                ['Enter', 'Delete', 'Backspace'].includes(event.key) ||
                (modifier && ['a', 'd'].includes(event.key.toLowerCase()))
            )
                event.preventDefault();
            return true;
        }
        return false;
    }
    function cancelTool() {
        if (tool === 'select') return false;
        setTool('select');
        setDrawingSettingsOpen(false);
        camera.viewportRef.current?.focus({ preventScroll: true });
        return true;
    }

    return {
        tool,
        drawingSettingsOpen,
        toggleDrawingSettings,
        placing,
        placementKind,
        chooseTool,
        placeBlock,
        cancelTool,
        handleToolKeyboard,
    };
}
