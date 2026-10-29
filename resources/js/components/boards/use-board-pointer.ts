// Summary: Orchestrates captured Board gestures and release-time commits; depends on camera geometry, transient shape/drawing previews and record actions.

import { commitBoardTransform } from './board-transform-commit';
import { boardMarqueeSelection } from './board-marquee-selection';
import { useBoardShapePlacement } from './use-board-shape-placement';
import { isBoardShapeTool } from './board-shape-data';
import type { BoardBounds, BoardShapeKind } from './board-types';
import { useBoardPanShortcut } from './use-board-pan-shortcut';
import { isBoardDrawingTool } from './board-drawing-data';
import type { BoardDrawingController } from './use-board-drawing';
import { useBoardPointerGeometry } from './use-board-pointer-geometry';
import { indexBoardAlignmentTargets } from './board-alignment-index';
import type { BoardGesture } from './board-pointer-types';
import { useCallback, useRef, type PointerEvent } from 'react';
import type { BoardObjectsController } from './use-board-objects';
import type { BoardCameraController } from './use-board-camera';
import { paintBoardObjects, paintBoardGuides } from './board-pointer-paint';
import { paintBoardGesturePreview } from './board-gesture-preview';
import { collectBoardPaintTargets } from './board-pointer-paint';
import {
    canvasPoint,
    clamp,
    intersects,
    pinchGeometry,
} from './board-geometry';
import {
    type BoardPoint,
    type BoardPlacementKind,
    type BoardTool,
} from './board-types';

type BoardPointerSample = Pick<
    PointerEvent<HTMLDivElement>,
    'clientX' | 'clientY' | 'pointerId' | 'altKey' | 'shiftKey'
>;

export function useBoardPointer(
    model: BoardObjectsController,
    camera: BoardCameraController,
    blocked: boolean,
    editingLocked: () => boolean,
    interaction: {
        tool: BoardTool;
        drawing: BoardDrawingController;
        onStartDrawing: () => void;
        onPlaceShape: (kind: BoardShapeKind, bounds: BoardBounds) => void;
        onPlace: (kind: BoardPlacementKind, point: BoardPoint) => void;
    },
) {
    const shape = useBoardShapePlacement(camera, interaction.onPlaceShape);
    const shapeRef = useRef(shape);
    shapeRef.current = shape;
    const gesture = useRef<BoardGesture | null>(null);
    const drawingRef = useRef(interaction.drawing);
    drawingRef.current = interaction.drawing;
    const touches = useRef(new Map<number, BoardPoint>());
    const guidesRef = useRef<HTMLDivElement>(null);
    const marqueeRef = useRef<HTMLDivElement>(null);
    const frame = useRef<number | undefined>(undefined);
    const viewportRef = camera.viewportRef;
    const pointerLocalPoint = useBoardPointerGeometry(viewportRef);
    const pendingPointer = useRef(new Map<number, BoardPointerSample>());

    const cancel = useCallback(() => {
        const current = gesture.current;
        shapeRef.current.cancel();
        const drawingCanceled = drawingRef.current.cancel();
        if (current?.kind === 'move' || current?.kind === 'resize')
            paintBoardObjects(
                viewportRef.current,
                current.originals,
                current.paintTargets,
            );
        gesture.current = null;
        pendingPointer.current.clear();
        paintBoardGuides(guidesRef.current, []);
        if (marqueeRef.current) marqueeRef.current.hidden = true;
        if (viewportRef.current) viewportRef.current.dataset.gesture = '';
        if (frame.current !== undefined) cancelAnimationFrame(frame.current);
        frame.current = undefined;
        return current !== null || drawingCanceled;
    }, [viewportRef]);

    const clearTouches = useCallback(() => touches.current.clear(), []);
    const space = useBoardPanShortcut(viewportRef, cancel, clearTouches);

    function onPointerDown(event: PointerEvent<HTMLDivElement>) {
        const target = event.target as Element;
        //
        // React portals bubble through the canvas component tree even when their menu is outside the canvas DOM.
        //
        if (!event.currentTarget.contains(target)) return;
        if (
            target.closest(
                '[data-board-editor], [data-board-interactive], .board-object-preview :is(button, a, input, textarea, select, video, audio, [role=slider])',
            ) ||
            editingLocked() ||
            ![0, 1].includes(event.button)
        )
            return;
        //
        // Commit property field edits before changing selection replaces their panel.
        //
        const activeField = document.activeElement;
        if (
            activeField instanceof HTMLElement &&
            activeField.closest('[data-board-properties]')
        )
            activeField.blur();
        event.preventDefault();
        event.currentTarget.focus({ preventScroll: true });
        //
        // Keep click/double-click targeted at the object; capturing them on the canvas swallowed native edit activation.
        //
        (
            target.closest<HTMLElement>('[data-board-object-id]') ??
            event.currentTarget
        ).setPointerCapture(event.pointerId);
        const local = pointerLocalPoint(
            { x: event.clientX, y: event.clientY },
            true,
        );
        if (event.pointerType === 'touch')
            touches.current.set(event.pointerId, local);
        if (touches.current.size >= 2) {
            cancel();
            const pinch = pinchGeometry([...touches.current.values()]);
            gesture.current = {
                kind: 'pinch',
                camera: { ...camera.cameraRef.current },
                distance: pinch.distance,
                anchor: canvasPoint(pinch.midpoint, camera.cameraRef.current),
            };
            return;
        }
        if (gesture.current) return;
        const objectId =
            target.closest<HTMLElement>('[data-board-object-id]')?.dataset
                .boardObjectId ??
            (target.closest('[data-board-selection-drag]')
                ? model.selectedRef.current[0]
                : undefined);
        if (
            event.button === 1 ||
            space.current ||
            interaction.tool === 'hand' ||
            (event.pointerType === 'touch' &&
                !objectId &&
                interaction.tool === 'select')
        ) {
            gesture.current = {
                kind: 'pan',
                pointerId: event.pointerId,
                start: local,
                camera: { ...camera.cameraRef.current },
            };
            event.currentTarget.dataset.gesture = 'pan';
            return;
        }
        if (isBoardDrawingTool(interaction.tool)) {
            if (!blocked) {
                interaction.drawing.start(
                    interaction.tool,
                    canvasPoint(local, camera.cameraRef.current),
                    event.shiftKey,
                );
                gesture.current = { kind: 'draw', pointerId: event.pointerId };
                event.currentTarget.dataset.gesture = 'draw';
                // Dismiss the brush picker on the first canvas press without
                // switching away from the active drawing tool.
                interaction.onStartDrawing();
            }
            return;
        }
        if (isBoardShapeTool(interaction.tool)) {
            if (!blocked) {
                shape.start(interaction.tool, local);
                gesture.current = { kind: 'shape', pointerId: event.pointerId };
                event.currentTarget.dataset.gesture = 'shape';
            }
            return;
        }
        if (interaction.tool !== 'select') {
            if (!blocked)
                gesture.current = {
                    kind: 'place',
                    pointerId: event.pointerId,
                    start: local,
                    blockKind: interaction.tool,
                    moved: false,
                };
            return;
        }
        model.finishEditing();
        if (!objectId) {
            const previous =
                event.shiftKey || event.metaKey || event.ctrlKey
                    ? model.selectedRef.current
                    : [];
            model.select(previous);
            gesture.current = {
                kind: 'marquee',
                pointerId: event.pointerId,
                start: local,
                end: local,
                previous,
            };
            return;
        }
        const modified = event.shiftKey || event.metaKey || event.ctrlKey;
        const selected = model.selectedRef.current.includes(objectId);
        const nextIds = modified
            ? selected
                ? model.selectedRef.current.filter((id) => id !== objectId)
                : [...model.selectedRef.current, objectId]
            : selected
              ? model.selectedRef.current
              : [objectId];
        model.select(nextIds);
        if (blocked || modified) return;
        const resize = target.closest<HTMLElement>('[data-board-resize]')
            ?.dataset.boardResize;
        if (
            !resize &&
            !target.closest('[data-board-drag], [data-board-selection-drag]')
        )
            return;
        const originals = model.objectsRef.current.filter((object) =>
            resize ? object.id === objectId : nextIds.includes(object.id),
        );
        const targets = model.objectsRef.current.filter((object) =>
            intersects(camera.visibleBounds, object),
        );
        gesture.current = {
            kind: resize ? 'resize' : 'move',
            pointerId: event.pointerId,
            start: canvasPoint(local, camera.cameraRef.current),
            screenStart: local,
            activated: false,
            targets,
            alignmentIndex: resize
                ? undefined
                : indexBoardAlignmentTargets(targets, originals),
            paintTargets: collectBoardPaintTargets(viewportRef.current),
            originals,
            preview: originals,
            axis: resize ?? '',
            guides: [],
        };
    }

    function onPointerMove(event: PointerEvent<HTMLDivElement>) {
        const current = gesture.current;
        if (
            !current ||
            (current.kind !== 'pinch' && current.pointerId !== event.pointerId)
        )
            return;
        if (current.kind === 'draw') {
            if (touches.current.has(event.pointerId))
                touches.current.set(
                    event.pointerId,
                    pointerLocalPoint({ x: event.clientX, y: event.clientY }),
                );
            const samples = event.nativeEvent.getCoalescedEvents?.() ?? [];
            const points = (samples.length ? samples : [event]).map((sample) =>
                canvasPoint(
                    pointerLocalPoint({ x: sample.clientX, y: sample.clientY }),
                    camera.cameraRef.current,
                ),
            );
            interaction.drawing.move(points);
            return;
        }
        if (current.kind === 'pinch' && !touches.current.has(event.pointerId))
            return;
        pendingPointer.current.set(event.pointerId, {
            clientX: event.clientX,
            clientY: event.clientY,
            pointerId: event.pointerId,
            altKey: event.altKey,
            shiftKey: event.shiftKey,
        });
        if (frame.current !== undefined) return;
        //
        // High-frequency input only replaces the sample; geometry and layout run once per displayed frame.
        //
        frame.current = requestAnimationFrame(flushPointerPreview);
    }

    function flushPointerPreview() {
        if (frame.current !== undefined) cancelAnimationFrame(frame.current);
        frame.current = undefined;
        const samples = [...pendingPointer.current.values()];
        pendingPointer.current.clear();
        const event = samples.at(-1);
        const current = gesture.current;
        if (!event || !current || current.kind === 'draw') return;
        const localPoint = (sample: BoardPointerSample) =>
            pointerLocalPoint({
                x: sample.clientX,
                y: sample.clientY,
            });
        for (const sample of samples) {
            if (touches.current.has(sample.pointerId))
                touches.current.set(sample.pointerId, localPoint(sample));
        }
        const local = localPoint(event);
        if (current.kind === 'pinch') {
            if (touches.current.size < 2) return;
            const pinch = pinchGeometry([...touches.current.values()]);
            const zoom = clamp(
                (current.camera.zoom * pinch.distance) / current.distance,
                camera.minZoom,
                camera.maxZoom,
            );
            camera.setCamera({
                zoom,
                x: pinch.midpoint.x - current.anchor.x * zoom,
                y: pinch.midpoint.y - current.anchor.y * zoom,
            });
            return;
        }
        if (current.pointerId !== event.pointerId) return;
        if (current.kind === 'pan') {
            camera.setCamera({
                ...current.camera,
                x: current.camera.x + local.x - current.start.x,
                y: current.camera.y + local.y - current.start.y,
            });
            return;
        }
        if (current.kind === 'shape') {
            shape.move(local, event.shiftKey);
            return;
        }
        if (current.kind === 'place') {
            if (
                Math.hypot(
                    local.x - current.start.x,
                    local.y - current.start.y,
                ) > 6
            )
                current.moved = true;
            return;
        }
        if (current.kind === 'marquee') {
            current.end = local;
            if (marqueeRef.current) {
                marqueeRef.current.hidden = false;
                Object.assign(marqueeRef.current.style, {
                    left: `${Math.min(current.start.x, current.end.x)}px`,
                    top: `${Math.min(current.start.y, current.end.y)}px`,
                    width: `${Math.abs(current.start.x - current.end.x)}px`,
                    height: `${Math.abs(current.start.y - current.end.y)}px`,
                });
            }
        } else {
            paintBoardGesturePreview({
                gesture: current,
                local,
                camera,
                viewport: viewportRef.current,
                guides: guidesRef.current,
                altKey: event.altKey,
                shiftKey: event.shiftKey,
            });
        }
    }

    function onPointerUp(event: PointerEvent<HTMLDivElement>) {
        const active = gesture.current;
        if (
            active &&
            (active.kind === 'pinch' || active.pointerId === event.pointerId)
        ) {
            //
            // Release may arrive before the scheduled frame; commit the final pointer position synchronously.
            //
            onPointerMove(event);
            flushPointerPreview();
        }
        touches.current.delete(event.pointerId);
        const current = gesture.current;
        if (current?.kind === 'pinch') {
            if (touches.current.size >= 2) {
                const pinch = pinchGeometry([...touches.current.values()]);
                gesture.current = {
                    kind: 'pinch',
                    camera: { ...camera.cameraRef.current },
                    distance: pinch.distance,
                    anchor: canvasPoint(
                        pinch.midpoint,
                        camera.cameraRef.current,
                    ),
                };
                return;
            }
            const remaining = [...touches.current.entries()][0];
            gesture.current = remaining
                ? {
                      kind: 'pan',
                      pointerId: remaining[0],
                      start: remaining[1],
                      camera: { ...camera.cameraRef.current },
                  }
                : null;
        } else if (current && current.pointerId === event.pointerId) {
            if (current.kind === 'draw') interaction.drawing.finish();
            if (current.kind === 'shape') shape.finish(event.shiftKey);
            if (current.kind === 'place') {
                const end = camera.localPoint({
                    x: event.clientX,
                    y: event.clientY,
                });
                if (
                    !current.moved &&
                    Math.hypot(
                        end.x - current.start.x,
                        end.y - current.start.y,
                    ) <= 6
                )
                    interaction.onPlace(
                        current.blockKind,
                        camera.worldPoint({
                            x: event.clientX,
                            y: event.clientY,
                        }),
                    );
            }
            if (current.kind === 'marquee') {
                model.select(
                    boardMarqueeSelection({
                        ...current,
                        camera: camera.cameraRef.current,
                        objects: model.objectsRef.current,
                    }),
                );
            }
            if (current.kind === 'move' || current.kind === 'resize') {
                commitBoardTransform(model, current, viewportRef.current);
            }
            gesture.current = null;
        }
        paintBoardGuides(guidesRef.current, []);
        if (marqueeRef.current) marqueeRef.current.hidden = true;
        const captured =
            (event.target as Element).closest<HTMLElement>(
                '[data-board-object-id]',
            ) ?? event.currentTarget;
        if (captured.hasPointerCapture(event.pointerId))
            captured.releasePointerCapture(event.pointerId);
        event.currentTarget.dataset.gesture = '';
    }

    function onPointerCancel() {
        cancel();
        touches.current.clear();
    }
    function onLostPointerCapture(event: PointerEvent<HTMLDivElement>) {
        const current = gesture.current;
        if (
            current &&
            (current.kind === 'pinch'
                ? touches.current.has(event.pointerId)
                : current.pointerId === event.pointerId)
        )
            onPointerCancel();
    }
    return {
        shapePreviewRef: shape.previewRef,
        guidesRef,
        marqueeRef,
        cancel: () => {
            const active = cancel();
            touches.current.clear();
            return active;
        },
        onPointerDown,
        onPointerMove,
        onPointerUp,
        onPointerCancel,
        onLostPointerCapture,
    };
}
