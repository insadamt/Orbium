// Summary: Owns the native Stage's graphics/input layers and scratch drawing/shape services; depends on existing records and pure geometry, with no legacy workspace, editor or persistence mounts.

import Konva from 'konva';
import { toast } from 'sonner';
import { createNativeBoardCamera } from './board-native-camera';
import { createNativeBoardGrid } from './board-native-grid';
import {
    createNativeBoardGraphics,
    type NativeShapeKind,
} from './board-native-graphics';
import {
    attachNativeBoardInteractions,
    type NativeBoardTool,
} from './board-native-interactions';
import { attachNativeBoardDiagnostics } from './board-native-diagnostics';
import { createNativeInkSurface } from './board-native-ink-surface';
import {
    createNativeDrawing,
    type NativeDrawingSettings,
} from './board-native-drawing';
import { createNativePath } from './board-native-path';
import { createNativePlacement } from './board-native-placement';
import { createNativeTransformations } from './board-native-transformations';
import { boardEraserCursor } from '../board-eraser-session';
import type { BoardObject } from '../board-types';

type NativeStageCallbacks = {
    onSelectionChange: (object: BoardObject | null) => void;
    onPathCountChange: (count: number) => void;
    onToolChange: (tool: NativeBoardTool) => void;
    onHistoryChange: (state: number) => void;
};

export function createNativeBoardStage(
    host: HTMLDivElement,
    zoomLabel: HTMLSpanElement,
    callbacks: NativeStageCallbacks,
) {
    const stage = new Konva.Stage({
        container: host,
        id: crypto.randomUUID(),
        width: 1,
        height: 1,
    });
    const layer = new Konva.Layer();
    const inputLayer = new Konva.Layer({ listening: false });
    const styles = getComputedStyle(host);
    const grid = createNativeBoardGrid(
        stage,
        styles.getPropertyValue('--muted-foreground').trim() || styles.color,
    );
    layer.add(grid.node);
    const graphics = createNativeBoardGraphics(layer, styles.color);
    const camera = createNativeBoardCamera(stage);
    const transformations = createNativeTransformations({
        stage,
        layer,
        graphics,
        color: styles.color,
        notify: callbacks.onSelectionChange,
    });
    const surface = createNativeInkSurface(
        stage,
        inputLayer,
        () => drawing.flush(),
        styles.color,
    );
    const path = createNativePath({
        stage,
        layer: inputLayer,
        graphics,
        surface,
        notify: callbacks.onPathCountChange,
        notice: (message) => toast.info(message),
    });
    path.recolor(styles.color);
    const drawing = createNativeDrawing({
        stage,
        graphics,
        surface,
        path,
        notice: (message) => toast.info(message),
    });
    const placement = createNativePlacement(
        stage,
        inputLayer,
        graphics,
        styles.color,
    );
    const diagnostics = attachNativeBoardDiagnostics(stage, layer, {
        graphics,
        gridTile: grid.tile,
        inputLayer,
        readLiveCanvases: surface.readCanvases,
        readInkMetrics: () => ({
            preparation: { ...drawing.metrics },
            raster: { ...surface.metrics },
            activeGesture: drawing.active,
            activePath: path.active,
        }),
    });
    stage.add(layer);
    stage.add(inputLayer);
    const interactions = attachNativeBoardInteractions({
        stage,
        camera,
        graphics,
        transformations,
        drawing,
        placement,
        host,
        onToolChange: callbacks.onToolChange,
    });
    const unsubscribeHistory = graphics.store.subscribeHistory(() =>
        callbacks.onHistoryChange(graphics.store.getHistoryState()),
    );
    let disposed = false;

    stage.on('scaleXChange.label', () => {
        zoomLabel.textContent = `${Math.round(stage.scaleX() * 100)}%`;
    });
    function resizeViewport() {
        if (disposed) return;
        const width = Math.max(1, Math.round(host.clientWidth));
        const height = Math.max(1, Math.round(host.clientHeight));
        const ratio = window.devicePixelRatio || 1;
        if (layer.getCanvas().getPixelRatio() !== ratio) {
            layer.getCanvas().setPixelRatio(ratio);
            inputLayer.getCanvas().setPixelRatio(ratio);
            diagnostics.counters.resolutionChanges++;
        }
        //
        // Camera changes never enter this path; only viewport/resolution changes may resize backing buffers.
        //
        if (stage.width() !== width || stage.height() !== height) {
            stage.size({ width, height });
            diagnostics.counters.viewportResizes++;
        }
        inputLayer.getHitCanvas().setSize(0, 0);
    }
    const observer = new ResizeObserver(resizeViewport);
    observer.observe(host);
    window.addEventListener('resize', resizeViewport);
    resizeViewport();
    const themeObserver = new MutationObserver(() => {
        const nextStyles = getComputedStyle(host);
        graphics.recolor(nextStyles.color);
        transformations.recolor(nextStyles.color);
        surface.recolor(nextStyles.color);
        path.recolor(nextStyles.color);
        placement.recolor(nextStyles.color);
        grid.recolor(
            nextStyles.getPropertyValue('--muted-foreground').trim() ||
                nextStyles.color,
        );
    });
    themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class', 'style', 'data-theme'],
    });

    return {
        camera,
        setTool: (tool: NativeBoardTool) => interactions.setTool(tool),
        toggleGrid: () => grid.node.visible(!grid.node.visible()),
        fit: () => camera.fit(graphics.store.getObjects()),
        insert(kind: NativeShapeKind) {
            const id = graphics.insert(
                kind,
                camera.worldPoint({
                    x: stage.width() / 2 - 100,
                    y: stage.height() / 2 - 100,
                }),
            );
            interactions.setTool('select');
            interactions.select(id);
            host.focus({ preventScroll: true });
        },
        setDrawingSettings(settings: NativeDrawingSettings) {
            drawing.setSettings(settings);
            host.style.setProperty(
                '--board-eraser-cursor',
                boardEraserCursor(settings.eraserSize),
            );
        },
        finishPath: () => path.finish(),
        removeLastPathPoint: () => path.removeLastPoint(),
        cancelPath: () => path.cancel(),
        changeHistory(direction: 'undo' | 'redo') {
            interactions.cancel();
            graphics.store[direction]();
        },
        changeObject(object: BoardObject) {
            interactions.cancel();
            if (!graphics.store.changeObject(object))
                toast.info('This change exceeds the Board limits.');
        },
        changeLayer(direction: 'front' | 'back') {
            const id = transformations.selectedId;
            if (!id) return;
            interactions.cancel();
            const object = graphics.store.getObject(id)!;
            const others = graphics.store
                .getObjects()
                .filter((item) => item.id !== id);
            graphics.store.commitSnapshot(
                (direction === 'front'
                    ? [...others, object]
                    : [object, ...others]
                ).map((item, index) => ({ ...item, layer: index })),
            );
        },
        replaceFixture(count: number) {
            interactions.cancel();
            interactions.select(null);
            graphics.replaceFixture(count);
            camera.reset();
        },
        replaceGraphicsReference(objects: BoardObject[]) {
            if (
                objects.some(
                    (object) =>
                        !['shape', 'drawing'].includes(object.block_type),
                )
            )
                return;
            interactions.cancel();
            interactions.select(null);
            graphics.store.replaceSnapshot(
                objects.map((object, index) => ({ ...object, layer: index })),
            );
            camera.fit(graphics.store.getObjects());
        },
        snapshot: diagnostics.snapshot,
        dispose() {
            if (disposed) return;
            disposed = true;
            observer.disconnect();
            themeObserver.disconnect();
            window.removeEventListener('resize', resizeViewport);
            interactions.dispose();
            unsubscribeHistory();
            diagnostics.dispose();
            transformations.dispose();
            drawing.cancelAll();
            path.dispose();
            surface.dispose();
            placement.cancel();
            graphics.dispose();
            grid.dispose();
            host.style.removeProperty('--board-eraser-cursor');
            stage.destroy();
        },
    };
}

export type NativeBoardStage = ReturnType<typeof createNativeBoardStage>;
