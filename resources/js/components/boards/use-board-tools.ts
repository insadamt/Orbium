// Summary: Owns active Board creation tools and keyboard placement; depends on camera coordinates, native object actions and editing locks.

import {
    isBoardShapeTool,
    boardShapeDefaultSize,
} from './board-shape-data';
import type { BoardBounds, BoardShapeKind } from './board-types';
import { isBoardDrawingTool } from './board-drawing-data';
import { useState, type KeyboardEvent } from 'react';
import type { BoardObjectsController } from './use-board-objects';
import type { BoardCameraController } from './use-board-camera';
import type { BoardPlacementKind, BoardPoint, BoardTool } from './board-types';

export type BoardToolbarPanel = 'drawing' | 'shapes' | 'add';

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
    // A single owner prevents the Draw, Shapes and Add flyouts from stacking.
    const [openPanel, setOpenPanel] = useState<BoardToolbarPanel | null>(null);
    const drawingSettingsOpen =
        openPanel === 'drawing' && isBoardDrawingTool(tool);
    function setPanelOpen(panel: 'shapes' | 'add', open: boolean) {
        setOpenPanel((current) =>
            open ? panel : current === panel ? null : current,
        );
    }
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
        setOpenPanel(isBoardDrawingTool(nextTool) ? 'drawing' : null);
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
        setOpenPanel((current) =>
            current === 'drawing' ? null : 'drawing',
        );
        camera.viewportRef.current?.focus({ preventScroll: true });
    }
    function hideDrawingSettings() {
        setOpenPanel((current) => (current === 'drawing' ? null : current));
    }
    function placeShape(kind: BoardShapeKind, bounds: BoardBounds) {
        if (isLocked()) return;
        if (model.addShape(kind, bounds)) {
            setTool('select');
            setOpenPanel(null);
        }
    }
    function placeBlock(kind: BoardPlacementKind, point: BoardPoint) {
        if (isLocked()) return;
        if (isBoardShapeTool(kind)) {
            placeShape(kind, { ...point, ...boardShapeDefaultSize(kind) });
            return;
        }
        const previousCount = model.objectsRef.current.length;
        model.addBlock(point, kind);
        if (model.objectsRef.current.length > previousCount) {
            setTool('select');
            setOpenPanel(null);
        }
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
        setOpenPanel(null);
        camera.viewportRef.current?.focus({ preventScroll: true });
        return true;
    }

    return {
        tool,
        openPanel,
        setPanelOpen,
        drawingSettingsOpen,
        toggleDrawingSettings,
        hideDrawingSettings,
        placing,
        placementKind,
        chooseTool,
        placeBlock,
        placeShape,
        cancelTool,
        handleToolKeyboard,
    };
}
