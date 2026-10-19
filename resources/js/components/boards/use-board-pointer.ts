import type { BoardGesture } from './board-pointer-types';
import { useCallback, useEffect, useRef, type PointerEvent } from 'react';
import type { BoardObjectsController } from './use-board-objects';
import type { BoardCameraController } from './use-board-camera';
import { paintBoardObjects, paintBoardGuides } from './board-pointer-paint';
import { resolveBoardMove } from './board-alignment';
import {
    canvasPoint,
    clamp,
    intersects,
    pinchGeometry,
} from './board-geometry';
import { resizeBoardObject } from './board-resize-geometry';
import { paintBoardResizePreview } from './board-resize-preview';
import {
    boardLimits,
    type BoardPoint,
    type BoardBlockKind,
    type BoardTool,
} from './board-types';

export function useBoardPointer(
    model: BoardObjectsController,
    camera: BoardCameraController,
    blocked: boolean,
    editingLocked: () => boolean,
    interaction: {
        tool: BoardTool;
        onPlace: (kind: BoardBlockKind, point: BoardPoint) => void;
    },
) {
    const gesture = useRef<BoardGesture | null>(null);
    const touches = useRef(new Map<number, BoardPoint>());
    const space = useRef(false);
    const guidesRef = useRef<HTMLDivElement>(null);
    const marqueeRef = useRef<HTMLDivElement>(null);
    const frame = useRef<number | undefined>(undefined);
    const viewportRef = camera.viewportRef;

    const cancel = useCallback(() => {
        const current = gesture.current;
        if (current?.kind === 'move' || current?.kind === 'resize')
            paintBoardObjects(viewportRef.current, current.originals);
        gesture.current = null;
        paintBoardGuides(guidesRef.current, []);
        if (marqueeRef.current) marqueeRef.current.hidden = true;
        if (viewportRef.current) viewportRef.current.dataset.gesture = '';
        if (frame.current !== undefined) cancelAnimationFrame(frame.current);
        frame.current = undefined;
        return current !== null;
    }, [viewportRef]);

    useEffect(() => {
        const keydown = (event: KeyboardEvent) => {
            if (
                event.key !== ' ' ||
                event.ctrlKey ||
                event.metaKey ||
                (event.target instanceof Element &&
                    event.target.closest(
                        'input, textarea, [contenteditable="true"]',
                    ))
            )
                return;
            if (!viewportRef.current?.contains(document.activeElement)) return;
            event.preventDefault();
            space.current = true;
            viewportRef.current.dataset.space = 'true';
        };
        const resetSpace = () => {
            space.current = false;
            if (viewportRef.current)
                viewportRef.current.dataset.space = 'false';
        };
        const keyup = (event: KeyboardEvent) => {
            if (event.key === ' ') resetSpace();
        };
        const blur = () => {
            resetSpace();
            cancel();
            touches.current.clear();
        };
        window.addEventListener('keydown', keydown);
        window.addEventListener('keyup', keyup);
        window.addEventListener('blur', blur);
        return () => {
            blur();
            window.removeEventListener('keydown', keydown);
            window.removeEventListener('keyup', keyup);
            window.removeEventListener('blur', blur);
        };
    }, [cancel, viewportRef]);

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
        const local = camera.localPoint({ x: event.clientX, y: event.clientY });
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
        gesture.current = {
            kind: resize ? 'resize' : 'move',
            pointerId: event.pointerId,
            start: canvasPoint(local, camera.cameraRef.current),
            screenStart: local,
            activated: false,
            targets: model.objectsRef.current.filter((object) =>
                intersects(camera.visibleBounds, object),
            ),
            originals,
            preview: originals,
            axis: resize ?? '',
            guides: [],
        };
    }

    function onPointerMove(event: PointerEvent<HTMLDivElement>) {
        const local = camera.localPoint({ x: event.clientX, y: event.clientY });
        if (touches.current.has(event.pointerId))
            touches.current.set(event.pointerId, local);
        const current = gesture.current;
        if (!current) return;
        if (current.kind === 'pinch') {
            if (touches.current.size < 2) return;
            const pinch = pinchGeometry([...touches.current.values()]);
            const zoom = clamp(
                (current.camera.zoom * pinch.distance) / current.distance,
                boardLimits.minZoom,
                boardLimits.maxZoom,
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
        } else {
            //
            // Click jitter must not trigger snapping or add a move to history, regardless of canvas zoom.
            //
            if (
                !current.activated &&
                Math.hypot(
                    local.x - current.screenStart.x,
                    local.y - current.screenStart.y,
                ) < 6
            )
                return;
            current.activated = true;
            event.currentTarget.dataset.gesture = current.kind;
            const point = canvasPoint(local, camera.cameraRef.current);
            const dx = point.x - current.start.x;
            const dy = point.y - current.start.y;
            if (current.kind === 'resize') {
                current.preview = current.originals.map((object) =>
                    resizeBoardObject({
                        object,
                        axis: current.axis,
                        delta: { x: dx, y: dy },
                        snap: camera.snap && !event.altKey,
                        freeAspect: event.shiftKey,
                    }),
                );
            } else {
                const result = resolveBoardMove({
                    originals: current.originals,
                    objects: current.targets,
                    delta: { x: dx, y: dy },
                    zoom: camera.cameraRef.current.zoom,
                    snapToGrid: camera.snap,
                    smartGuides: camera.guides,
                    bypassSnap: event.altKey,
                });
                current.preview = result.objects;
                current.guides = result.guides;
            }
        }
        if (frame.current !== undefined) return;
        frame.current = requestAnimationFrame(() => {
            frame.current = undefined;
            const active = gesture.current;
            if (active?.kind === 'move' || active?.kind === 'resize') {
                if (active.kind === 'resize')
                    active.preview = paintBoardResizePreview(
                        viewportRef.current,
                        active.preview,
                        active.axis,
                    );
                else paintBoardObjects(viewportRef.current, active.preview);
                paintBoardGuides(guidesRef.current, active.guides);
            }
            if (active?.kind === 'marquee' && marqueeRef.current) {
                marqueeRef.current.hidden = false;
                Object.assign(marqueeRef.current.style, {
                    left: `${Math.min(active.start.x, active.end.x)}px`,
                    top: `${Math.min(active.start.y, active.end.y)}px`,
                    width: `${Math.abs(active.start.x - active.end.x)}px`,
                    height: `${Math.abs(active.start.y - active.end.y)}px`,
                });
            }
        });
    }

    function onPointerUp(event: PointerEvent<HTMLDivElement>) {
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
                const first = canvasPoint(
                    current.start,
                    camera.cameraRef.current,
                );
                const last = canvasPoint(current.end, camera.cameraRef.current);
                const bounds = {
                    x: Math.min(first.x, last.x),
                    y: Math.min(first.y, last.y),
                    width: Math.abs(first.x - last.x),
                    height: Math.abs(first.y - last.y),
                };
                const matched =
                    bounds.width > 2 && bounds.height > 2
                        ? model.objectsRef.current
                              .filter((object) => intersects(bounds, object))
                              .map((object) => object.id)
                        : [];
                model.select([...new Set([...current.previous, ...matched])]);
            }
            if (current.kind === 'move' || current.kind === 'resize') {
                if (current.kind === 'resize')
                    current.preview = paintBoardResizePreview(
                        viewportRef.current,
                        current.preview,
                        current.axis,
                    );
                else paintBoardObjects(viewportRef.current, current.preview);
                const changed = current.preview.some(
                    (object, index) =>
                        object.data !== current.originals[index].data ||
                        ['x', 'y', 'width', 'height'].some(
                            (field) =>
                                object[field as 'x'] !==
                                current.originals[index][field as 'x'],
                        ),
                );
                if (changed) {
                    const replacements = new Map(
                        current.preview.map((object) => [object.id, object]),
                    );
                    const accepted = model.commit(
                        model.objectsRef.current.map(
                            (object) => replacements.get(object.id) ?? object,
                        ),
                    );
                    if (!accepted)
                        paintBoardObjects(
                            viewportRef.current,
                            current.originals,
                        );
                }
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
