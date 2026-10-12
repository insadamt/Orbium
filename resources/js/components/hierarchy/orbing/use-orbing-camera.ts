import {
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    type PointerEvent,
} from 'react';
import {
    fitOrbingSpace,
    zoomOrbingAt,
    type OrbingCamera,
    type OrbingEntity,
    type ViewportSize,
    type WorldPoint,
    type WorldBounds,
} from './orbing-layout';
import {
    persistOrbingSnapshot,
    readOrbingSnapshot,
    type OrbingSnapshot,
} from './orbing-camera-storage';

function pointerCenter(points: WorldPoint[]): WorldPoint {
    return {
        x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
        y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
    };
}

function pointerDistance(points: WorldPoint[]) {
    return points.length < 2
        ? 0
        : Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
}

export function useOrbingCamera({
    storageKey,
    entities,
    bounds,
    initialSelectedId,
}: {
    storageKey: string;
    entities: OrbingEntity[];
    bounds: WorldBounds;
    initialSelectedId: number | null;
}) {
    const viewportRef = useRef<HTMLDivElement>(null);
    const [restored] = useState(() => readOrbingSnapshot(storageKey));
    const [snapshot, setSnapshot] = useState<OrbingSnapshot>(() => ({
        camera: restored?.camera ?? { x: 0, y: 0, zoom: 1 },
        selectedId: initialSelectedId ?? restored?.selectedId ?? null,
    }));
    const snapshotRef = useRef(snapshot);
    const initialized = useRef(false);
    const [size, setSize] = useState<ViewportSize>({ width: 800, height: 600 });
    const sizeRef = useRef(size);
    const pointers = useRef(new Map<number, WorldPoint>());
    const [dragging, setDragging] = useState(false);

    function updateSnapshot(next: OrbingSnapshot) {
        snapshotRef.current = next;
        setSnapshot(next);
    }

    function updateCamera(camera: OrbingCamera) {
        updateSnapshot({ ...snapshotRef.current, camera });
    }

    function selectNode(selectedId: number | null) {
        updateSnapshot({ ...snapshotRef.current, selectedId });
    }

    function fitView(center?: WorldPoint) {
        updateCamera(
            fitOrbingSpace(
                center ? { ...bounds, ...center } : bounds,
                sizeRef.current,
            ),
        );
    }

    function focusEntity(entity: WorldPoint) {
        updateCamera({
            x: entity.x,
            y: entity.y,
            zoom: Math.max(1, snapshotRef.current.camera.zoom),
        });
    }

    function zoomBy(factor: number) {
        const viewport = sizeRef.current;
        updateCamera(
            zoomOrbingAt(
                snapshotRef.current.camera,
                {
                    x: viewport.width / 2,
                    y: viewport.height / 2,
                },
                viewport,
                factor,
            ),
        );
    }

    function panBy(x: number, y: number) {
        const camera = snapshotRef.current.camera;
        updateCamera({
            ...camera,
            x: camera.x + x / camera.zoom,
            y: camera.y + y / camera.zoom,
        });
    }

    useLayoutEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport) return;
        function measureViewport() {
            if (!viewport) return;
            const bounds = viewport.getBoundingClientRect();
            viewport.style.height = `${Math.max(360, window.innerHeight - bounds.top - 24)}px`;
            const nextSize = {
                width: viewport.clientWidth,
                height: viewport.clientHeight,
            };
            sizeRef.current = nextSize;
            setSize(nextSize);
            if (initialized.current) return;
            initialized.current = true;
            const selected = entities.find(
                (entity) => entity.node.id === snapshotRef.current.selectedId,
            );
            const camera =
                initialSelectedId && selected
                    ? { x: selected.x, y: selected.y, zoom: 1 }
                    : restored && (restored.selectedId === null || selected)
                      ? restored.camera
                      : fitOrbingSpace(bounds, nextSize);
            const next = { camera, selectedId: selected?.node.id ?? null };
            snapshotRef.current = next;
            setSnapshot(next);
        }
        measureViewport();
        const observer = new ResizeObserver(measureViewport);
        observer.observe(viewport);
        const shellSpacer = viewport
            .closest('.floating-workspace')
            ?.querySelector('.floating-top-controls-spacer');
        if (shellSpacer) observer.observe(shellSpacer);
        window.addEventListener('resize', measureViewport);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', measureViewport);
        };
    }, [initialSelectedId, entities, bounds, restored]);

    useEffect(() => {
        const selectedId = snapshotRef.current.selectedId;
        if (
            selectedId === null ||
            entities.some((entity) => entity.node.id === selectedId)
        )
            return;
        const next = {
            camera: fitOrbingSpace(bounds, sizeRef.current),
            selectedId: null,
        };
        snapshotRef.current = next;
        setSnapshot(next);
    }, [entities, bounds]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            if (initialized.current)
                persistOrbingSnapshot(storageKey, snapshotRef.current);
        }, 250);
        return () => window.clearTimeout(timer);
    }, [snapshot, storageKey]);

    useEffect(() => {
        const flush = () => {
            if (initialized.current)
                persistOrbingSnapshot(storageKey, snapshotRef.current);
        };
        const flushWhenHidden = () => {
            if (document.hidden) flush();
        };
        window.addEventListener('pagehide', flush);
        document.addEventListener('visibilitychange', flushWhenHidden);
        return () => {
            flush();
            window.removeEventListener('pagehide', flush);
            document.removeEventListener('visibilitychange', flushWhenHidden);
        };
    }, [storageKey]);

    useEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport) return;
        function zoomWithWheel(event: WheelEvent) {
            if ((event.target as HTMLElement).closest('[data-orbing-controls]'))
                return;
            event.preventDefault();
            event.stopPropagation();
            const bounds = viewport!.getBoundingClientRect();
            const delta =
                event.deltaY *
                (event.deltaMode === 1
                    ? 16
                    : event.deltaMode === 2
                      ? sizeRef.current.height
                      : 1);
            const camera = zoomOrbingAt(
                snapshotRef.current.camera,
                {
                    x: event.clientX - bounds.left,
                    y: event.clientY - bounds.top,
                },
                sizeRef.current,
                Math.exp(-Math.max(-300, Math.min(300, delta)) * 0.002),
            );
            const next = { ...snapshotRef.current, camera };
            snapshotRef.current = next;
            setSnapshot(next);
        }
        viewport.addEventListener('wheel', zoomWithWheel, { passive: false });
        return () => viewport.removeEventListener('wheel', zoomWithWheel);
    }, []);

    function localPointer(event: PointerEvent<HTMLDivElement>) {
        const bounds = event.currentTarget.getBoundingClientRect();
        return {
            x: event.clientX - bounds.left,
            y: event.clientY - bounds.top,
        };
    }

    function startPan(event: PointerEvent<HTMLDivElement>) {
        if (
            event.button !== 0 ||
            (event.target as HTMLElement).closest(
                'button, [data-orbing-node], [data-orbing-controls]',
            )
        )
            return;
        event.preventDefault();
        event.currentTarget.focus({ preventScroll: true });
        event.currentTarget.setPointerCapture(event.pointerId);
        pointers.current.set(event.pointerId, localPointer(event));
        setDragging(true);
    }

    function movePan(event: PointerEvent<HTMLDivElement>) {
        if (!pointers.current.has(event.pointerId)) return;
        const before = [...pointers.current.values()];
        pointers.current.set(event.pointerId, localPointer(event));
        const after = [...pointers.current.values()];
        const previousCenter = pointerCenter(before);
        const nextCenter = pointerCenter(after);
        const distance = pointerDistance(before);
        const camera =
            distance > 0
                ? zoomOrbingAt(
                      snapshotRef.current.camera,
                      previousCenter,
                      sizeRef.current,
                      pointerDistance(after) / distance,
                  )
                : snapshotRef.current.camera;
        updateCamera({
            ...camera,
            x: camera.x - (nextCenter.x - previousCenter.x) / camera.zoom,
            y: camera.y - (nextCenter.y - previousCenter.y) / camera.zoom,
        });
    }

    function endPan(event: PointerEvent<HTMLDivElement>) {
        pointers.current.delete(event.pointerId);
        if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId);
        setDragging(pointers.current.size > 0);
    }

    return {
        viewportRef,
        camera: snapshot.camera,
        selectedId: snapshot.selectedId,
        size,
        dragging,
        selectNode,
        fitView,
        focusEntity,
        zoomBy,
        panBy,
        pointerHandlers: {
            onPointerDown: startPan,
            onPointerMove: movePan,
            onPointerUp: endPan,
            onPointerCancel: endPan,
            onLostPointerCapture: endPan,
        },
    };
}
