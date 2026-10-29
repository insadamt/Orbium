// Summary: Owns transient shape drag previews and one release-time insertion, using Board camera geometry without publishing pointer moves to history/autosave.

import { useRef, type RefObject } from 'react';
import {
    boardShapePath,
    boardShapeDefaultSize,
    boardShapePlacementBounds,
    isBoardShapeTool,
} from './board-shape-data';
import { canvasPoint } from './board-geometry';
import type { BoardCameraController } from './use-board-camera';
import type {
    BoardBounds,
    BoardPoint,
    BoardShapeKind,
    BoardTool,
} from './board-types';

export function useBoardShapePlacement(
    camera: BoardCameraController,
    onPlace: (kind: BoardShapeKind, bounds: BoardBounds) => void,
) {
    const previewRef = useRef<HTMLDivElement>(null);
    const session = useRef<{
        kind: BoardShapeKind;
        localStart: BoardPoint;
        worldStart: BoardPoint;
        bounds: BoardBounds;
        moved: boolean;
    } | null>(null);

    function cancel() {
        session.current = null;
        if (previewRef.current) previewRef.current.hidden = true;
    }
    function start(kind: BoardShapeKind, local: BoardPoint) {
        const worldStart = canvasPoint(local, camera.cameraRef.current);
        session.current = {
            kind,
            localStart: local,
            worldStart,
            bounds: { ...worldStart, ...boardShapeDefaultSize(kind) },
            moved: false,
        };
    }
    function move(local: BoardPoint, equalSides: boolean) {
        const current = session.current;
        if (!current) return;
        current.moved ||=
            Math.hypot(
                local.x - current.localStart.x,
                local.y - current.localStart.y,
            ) > 6;
        if (!current.moved) return;
        const activeCamera = camera.cameraRef.current;
        current.bounds = boardShapePlacementBounds(
            current.worldStart,
            canvasPoint(local, activeCamera),
            equalSides || current.kind === 'circle',
        );
        const preview = previewRef.current;
        if (!preview) return;
        preview.hidden = false;
        Object.assign(preview.style, {
            left: `${current.bounds.x * activeCamera.zoom + activeCamera.x}px`,
            top: `${current.bounds.y * activeCamera.zoom + activeCamera.y}px`,
            width: `${current.bounds.width * activeCamera.zoom}px`,
            height: `${current.bounds.height * activeCamera.zoom}px`,
        });
    }
    function finish(equalSides: boolean) {
        const current = session.current;
        if (!current) return;
        const bounds = current.moved
            ? current.bounds
            : {
                  ...current.bounds,
                  ...boardShapeDefaultSize(current.kind),
                  ...(equalSides
                      ? {
                            height: boardShapeDefaultSize(current.kind).width,
                        }
                      : {}),
              };
        cancel();
        onPlace(current.kind, bounds);
    }
    return { previewRef, start, move, finish, cancel };
}

export function BoardShapePlacementPreview({
    previewRef,
    tool,
}: {
    previewRef: RefObject<HTMLDivElement | null>;
    tool: BoardTool;
}) {
    return (
        <div
            ref={previewRef}
            className="board-shape-placement"
            hidden
            aria-hidden="true"
        >
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                <path
                    d={boardShapePath(
                        isBoardShapeTool(tool) ? tool : 'rectangle',
                    )}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                    strokeLinejoin="round"
                />
            </svg>
        </div>
    );
}
