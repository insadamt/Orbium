// Summary: Routes navigation and selection to Konva's native hit graph and drag lifecycle; depends on the Stage camera, scratch graphics and a selection Transformer.

import type Konva from 'konva';
import type { NativeBoardCamera } from './board-native-camera';
import type {
    NativeBoardGraphics,
    NativeShapeKind,
} from './board-native-graphics';

export type NativeBoardTool = 'select' | 'hand' | NativeShapeKind;

export function attachNativeBoardInteractions({
    stage,
    camera,
    graphics,
    selection,
    host,
}: {
    stage: Konva.Stage;
    camera: NativeBoardCamera;
    graphics: NativeBoardGraphics;
    selection: Konva.Transformer;
    host: HTMLDivElement;
}) {
    let tool: NativeBoardTool = 'select';
    let space = false;
    let middle = false;
    let pressed = false;
    let panOrigin = camera.read();
    let pinch: {
        distance: number;
        zoom: number;
        anchor: { x: number; y: number };
    } | null = null;
    let touchBounds = { left: 0, top: 0 };
    let suppressTouch = false;

    function updateDragMode() {
        const pan = !suppressTouch && (tool === 'hand' || space || middle);
        stage.draggable(pan);
        graphics.setDraggable(!suppressTouch && !pan && tool === 'select');
        selection.listening(!suppressTouch && !pan && tool === 'select');
        host.dataset.tool = pan ? 'hand' : tool;
    }

    function select(id: string | null) {
        const group = id ? graphics.groups.get(id) : undefined;
        selection.nodes(group ? [group] : []);
        selection.moveToTop();
    }

    function cancel() {
        graphics.cancelDrags();
        if (stage.isDragging()) {
            camera.apply(panOrigin);
        }
        stage.stopDrag();
        pinch = null;
        suppressTouch = false;
        pressed = false;
        space = false;
        middle = false;
        updateDragMode();
    }

    const preparePointer = (event: PointerEvent) => {
        if (event.button > 1) return;
        host.focus({ preventScroll: true });
        pressed = true;
        panOrigin = camera.read();
        middle = event.button === 1;
        updateDragMode();
        //
        // Native DOM capture keeps the library's own drag events flowing beyond the canvas edge.
        //
        if (event.pointerType !== 'touch')
            stage.content.setPointerCapture(event.pointerId);
    };
    const finishPointer = () => {
        pressed = false;
        middle = false;
        updateDragMode();
    };
    const lostCapture = () => {
        if (pressed) cancel();
    };

    stage.on('mousedown.native touchstart.native', (event) => {
        if ('button' in event.evt && event.evt.button !== 0) return;
        if (tool === 'hand' || space || middle || suppressTouch) return;
        const object = event.target.findAncestor('.native-board-object', true);
        if (tool !== 'select') {
            const pointer = stage.getPointerPosition();
            if (pointer)
                select(graphics.insert(tool, camera.worldPoint(pointer)));
            return;
        }
        select(object?.id() ?? null);
        if (!object && event.evt.type === 'touchstart') stage.startDrag(event);
    });
    stage.on('dragstart.native', (event) => {
        if (event.target !== stage) select(event.target.id());
    });

    stage.on('wheel.native', (event: Konva.KonvaEventObject<WheelEvent>) => {
        event.evt.preventDefault();
        const wheel = event.evt;
        const unit =
            wheel.deltaMode === 1
                ? 16
                : wheel.deltaMode === 2
                  ? stage.height()
                  : 1;
        if (wheel.ctrlKey || wheel.metaKey) {
            wheel.stopPropagation();
            const pointer = stage.getPointerPosition();
            if (pointer)
                camera.zoomAt(
                    pointer,
                    stage.scaleX() * Math.exp(-wheel.deltaY * unit * 0.005),
                );
        } else {
            const current = camera.read();
            const horizontal = wheel.shiftKey && wheel.deltaX === 0;
            camera.apply({
                ...current,
                x:
                    current.x -
                    (horizontal ? wheel.deltaY : wheel.deltaX) * unit,
                y: current.y - (horizontal ? 0 : wheel.deltaY) * unit,
            });
        }
    });

    function touchGeometry(event: TouchEvent) {
        const [first, second] = Array.from(event.touches);
        return {
            center: {
                x: (first.clientX + second.clientX) / 2 - touchBounds.left,
                y: (first.clientY + second.clientY) / 2 - touchBounds.top,
            },
            distance: Math.hypot(
                first.clientX - second.clientX,
                first.clientY - second.clientY,
            ),
        };
    }
    const touchStart = (event: TouchEvent) => {
        if (event.touches.length < 2) return;
        event.preventDefault();
        cancel();
        suppressTouch = true;
        stage.draggable(false);
        graphics.setDraggable(false);
        touchBounds = stage.content.getBoundingClientRect();
        const { center, distance } = touchGeometry(event);
        pinch = {
            distance: Math.max(1, distance),
            zoom: stage.scaleX(),
            anchor: camera.worldPoint(center),
        };
    };
    const touchMove = (event: TouchEvent) => {
        if (!suppressTouch) return;
        event.preventDefault();
        if (!pinch || event.touches.length < 2) return;
        const { center, distance } = touchGeometry(event);
        const zoom = Math.max(
            0.1,
            Math.min(4, (pinch.zoom * distance) / pinch.distance),
        );
        camera.apply({
            x: center.x - pinch.anchor.x * zoom,
            y: center.y - pinch.anchor.y * zoom,
            zoom,
        });
    };
    const touchEnd = (event: TouchEvent) => {
        if (!suppressTouch) return;
        if (!event.touches.length) {
            pinch = null;
            suppressTouch = false;
            updateDragMode();
        }
    };

    const keyDown = (event: KeyboardEvent) => {
        if (event.target !== host) return;
        if (event.code === 'Space') {
            event.preventDefault();
            if (!space) {
                space = true;
                updateDragMode();
            }
        } else if (event.key === 'Escape') {
            event.preventDefault();
            cancel();
            select(null);
        } else if (
            ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(
                event.key,
            )
        ) {
            event.preventDefault();
            const step = event.shiftKey ? 100 : 32;
            const current = camera.read();
            camera.apply({
                ...current,
                x:
                    current.x +
                    (event.key === 'ArrowLeft'
                        ? step
                        : event.key === 'ArrowRight'
                          ? -step
                          : 0),
                y:
                    current.y +
                    (event.key === 'ArrowUp'
                        ? step
                        : event.key === 'ArrowDown'
                          ? -step
                          : 0),
            });
        } else if (event.key === '+' || event.key === '=') {
            event.preventDefault();
            camera.zoomBy(1.2);
        } else if (event.key === '-') {
            event.preventDefault();
            camera.zoomBy(1 / 1.2);
        } else if (event.key === '0') {
            event.preventDefault();
            camera.reset();
        }
    };
    const keyUp = (event: KeyboardEvent) => {
        if (event.code === 'Space' && space) {
            space = false;
            updateDragMode();
        }
    };

    const controller = new AbortController();
    const options = { signal: controller.signal };
    stage.content.addEventListener('pointerdown', preparePointer, {
        ...options,
        capture: true,
    });
    stage.content.addEventListener('pointerup', finishPointer, options);
    stage.content.addEventListener('pointercancel', cancel, {
        ...options,
        capture: true,
    });
    stage.content.addEventListener('lostpointercapture', lostCapture, options);
    stage.content.addEventListener('touchstart', touchStart, {
        ...options,
        passive: false,
        capture: true,
    });
    stage.content.addEventListener('touchmove', touchMove, {
        ...options,
        passive: false,
        capture: true,
    });
    stage.content.addEventListener('touchend', touchEnd, {
        ...options,
        capture: true,
    });
    stage.content.addEventListener('touchcancel', cancel, {
        ...options,
        capture: true,
    });
    stage.content.addEventListener(
        'contextmenu',
        (event) => event.preventDefault(),
        options,
    );
    stage.content.addEventListener(
        'mousedown',
        (event) => {
            if (event.button === 1) event.preventDefault();
        },
        options,
    );
    host.addEventListener('keydown', keyDown, options);
    window.addEventListener('keyup', keyUp, options);
    window.addEventListener('blur', cancel, options);
    document.addEventListener(
        'visibilitychange',
        () => {
            if (document.hidden) cancel();
        },
        options,
    );
    updateDragMode();

    return {
        select,
        cancel,
        setTool(next: NativeBoardTool) {
            cancel();
            tool = next;
            updateDragMode();
        },
        dispose() {
            cancel();
            controller.abort();
            stage.off('.native');
        },
    };
}
