import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { toast } from 'sonner';
import {
    boardDrawingPath,
    boardDrawingPointLimit,
    createBoardDrawingObject,
    type BoardBrush,
} from './board-drawing-data';
import { boardLimits, type BoardPoint } from './board-types';
import type { BoardObjectsController } from './use-board-objects';
import type { BoardCameraController } from './use-board-camera';

type PathPoint = [number, number];
type PathDraft = {
    points: PathPoint[];
    brush: BoardBrush;
    hover: PathPoint | null;
};

export function useBoardPathDrawing(
    model: BoardObjectsController,
    camera: BoardCameraController,
    brush: BoardBrush,
    isLocked: () => boolean,
) {
    const draft = useRef<PathDraft | null>(null);
    const [pointCount, setPointCount] = useState(0);
    const pathRef = useRef<SVGPathElement>(null);
    const anchorsRef = useRef<SVGGElement>(null);
    const frame = useRef<number | undefined>(undefined);
    const pendingPointer = useRef<{
        x: number;
        y: number;
        shift: boolean;
    } | null>(null);
    const handlers = useRef({ movePointer, finish });
    handlers.current = { movePointer, finish };

    useEffect(() => {
        if (!draft.current) return;
        draft.current.brush = { ...brush };
        schedulePaint();
    }, [brush]);

    function paint() {
        frame.current = undefined;
        const current = draft.current;
        if (!current) return;
        const pointer = pendingPointer.current;
        if (pointer) {
            const point = camera.worldPoint(pointer);
            current.hover = snapPoint(point, pointer.shift);
            pendingPointer.current = null;
        }
        const points = current.hover
            ? [...current.points, current.hover]
            : current.points;
        pathRef.current?.setAttribute('d', boardDrawingPath(points));
        pathRef.current?.setAttribute('stroke', current.brush.color);
        pathRef.current?.setAttribute(
            'stroke-width',
            String(current.brush.width),
        );
    }
    function schedulePaint() {
        if (frame.current === undefined)
            frame.current = requestAnimationFrame(paint);
    }
    function snapPoint(point: BoardPoint, constrain: boolean): PathPoint {
        const last = draft.current?.points.at(-1);
        if (!last || !constrain) return [point.x, point.y];
        const dx = point.x - last[0];
        const dy = point.y - last[1];
        const angle =
            (Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * Math.PI) / 4;
        const length = Math.hypot(dx, dy);
        return [
            last[0] + Math.cos(angle) * length,
            last[1] + Math.sin(angle) * length,
        ];
    }
    function paintAnchors() {
        const group = anchorsRef.current;
        if (!group) return;
        const points = draft.current?.points ?? [];
        while (group.children.length > points.length)
            group.lastElementChild?.remove();
        points.forEach(([x, y], index) => {
            let anchor = group.children[index] as SVGGElement | undefined;
            if (!anchor) {
                anchor = document.createElementNS(
                    'http://www.w3.org/2000/svg',
                    'g',
                );
                const square = document.createElementNS(
                    'http://www.w3.org/2000/svg',
                    'rect',
                );
                square.setAttribute('class', 'board-path-anchor');
                anchor.append(square);
                group.append(anchor);
            }
            const transform = `translate(${x} ${y})`;
            if (anchor.getAttribute('transform') !== transform)
                anchor.setAttribute('transform', transform);
            const square = anchor.firstElementChild!;
            const active = String(index === points.length - 1);
            if (square.getAttribute('data-active') !== active)
                square.setAttribute('data-active', active);
        });
    }

    function cancel() {
        const active = draft.current !== null;
        draft.current = null;
        pendingPointer.current = null;
        if (frame.current !== undefined) cancelAnimationFrame(frame.current);
        frame.current = undefined;
        pathRef.current?.setAttribute('d', '');
        anchorsRef.current?.replaceChildren();
        if (active) setPointCount(0);
        return active;
    }
    function withinLimits(points: PathPoint[]) {
        if (points.length > boardDrawingPointLimit) return false;
        const xs = points.map(([x]) => x);
        const ys = points.map(([, y]) => y);
        return (
            points.every(
                ([x, y]) =>
                    Number.isFinite(x) &&
                    Number.isFinite(y) &&
                    Math.abs(x) <= boardLimits.coordinate - 32 &&
                    Math.abs(y) <= boardLimits.coordinate - 32,
            ) &&
            Math.max(...xs) - Math.min(...xs) <= 3900 &&
            Math.max(...ys) - Math.min(...ys) <= 3900
        );
    }
    function finish(close = false) {
        const current = draft.current;
        if (!current || isLocked()) return;
        if (current.points.length < 2) {
            cancel();
            return;
        }
        const points = close
            ? [...current.points, current.points[0]]
            : current.points;
        if (!withinLimits(points)) {
            toast.info(
                'Path limit reached. Remove a point or finish an open path.',
            );
            return;
        }
        const layer = model.objectsRef.current.reduce(
            (highest, object) => Math.max(highest, object.layer + 1),
            0,
        );
        const object = createBoardDrawingObject(
            points,
            current.brush,
            false,
            layer,
        );
        //
        // Only a completed path enters history/autosave; a rejected commit keeps its editable draft intact.
        //
        if (model.commit([...model.objectsRef.current, object])) cancel();
    }
    function addPoint(point: BoardPoint, shift: boolean) {
        if (isLocked()) return;
        const next = snapPoint(point, shift);
        const current = draft.current;
        const first = current?.points[0];
        if (
            first &&
            current.points.length >= 3 &&
            Math.hypot(point.x - first[0], point.y - first[1]) *
                camera.cameraRef.current.zoom <=
                8
        ) {
            finish(true);
            return;
        }
        const last = current?.points.at(-1);
        //
        // The second press in a double-click must not add a duplicate endpoint before the finish event arrives.
        //
        if (
            last &&
            Math.hypot(next[0] - last[0], next[1] - last[1]) *
                camera.cameraRef.current.zoom <
                3
        )
            return;
        const points = [...(current?.points ?? []), next];
        if (!withinLimits(points)) {
            toast.info(
                'Path limit reached. Finish this path before starting another.',
            );
            return;
        }
        draft.current = {
            points,
            brush: current?.brush ?? { ...brush },
            hover: null,
        };
        pendingPointer.current = null;
        setPointCount(points.length);
        paintAnchors();
        schedulePaint();
    }
    function removeLastPoint() {
        const current = draft.current;
        if (!current || isLocked()) return false;
        current.points.pop();
        if (!current.points.length) cancel();
        else {
            setPointCount(current.points.length);
            paintAnchors();
            schedulePaint();
        }
        return true;
    }
    function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
        if (
            !draft.current ||
            event.defaultPrevented ||
            event.nativeEvent.isComposing ||
            isLocked() ||
            (event.target as Element).closest(
                'button, a, input, textarea, select, [contenteditable="true"], [role="dialog"], [role="menu"], [role="listbox"]',
            )
        )
            return false;
        const modifier = event.ctrlKey || event.metaKey;
        if (event.key === 'Enter' && !modifier) finish();
        else if (
            event.key === 'Backspace' ||
            (modifier && !event.shiftKey && event.key.toLowerCase() === 'z')
        )
            removeLastPoint();
        else return false;
        event.preventDefault();
        event.stopPropagation();
        return true;
    }
    function movePointer(event: globalThis.PointerEvent) {
        if (!draft.current) return;
        const viewport = camera.viewportRef.current;
        if (
            !viewport ||
            viewport.dataset.gesture === 'pan' ||
            viewport.dataset.space === 'true'
        ) {
            draft.current.hover = null;
            pendingPointer.current = null;
        } else
            pendingPointer.current = {
                x: event.clientX,
                y: event.clientY,
                shift: event.shiftKey,
            };
        schedulePaint();
    }
    useEffect(() => {
        const viewport = camera.viewportRef.current;
        if (!viewport) return;
        //
        // A multi-click draft outlives pointer capture, so hover preview belongs to the mounted canvas rather than a drag gesture.
        //
        const move = (event: globalThis.PointerEvent) =>
            handlers.current.movePointer(event);
        const doubleClick = (event: MouseEvent) => {
            if (!draft.current || !viewport.contains(event.target as Node))
                return;
            event.preventDefault();
            event.stopPropagation();
            handlers.current.finish();
        };
        const leave = () => {
            pendingPointer.current = null;
            if (draft.current) {
                draft.current.hover = null;
                schedulePaint();
            }
        };
        viewport.addEventListener('pointermove', move);
        viewport.addEventListener('dblclick', doubleClick);
        viewport.addEventListener('pointerleave', leave);
        return () => {
            viewport.removeEventListener('pointermove', move);
            viewport.removeEventListener('dblclick', doubleClick);
            viewport.removeEventListener('pointerleave', leave);
            if (frame.current !== undefined)
                cancelAnimationFrame(frame.current);
        };
    }, [camera.viewportRef]);

    return {
        addPoint,
        finish: () => finish(),
        cancel,
        removeLastPoint,
        handleKeyDown,
        pointCount,
        pathRef,
        anchorsRef,
    };
}
