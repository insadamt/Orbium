// Summary: Owns one independent viewport-sized Konva Stage and its disposable graphics, camera and input services; depends on existing Board records, with no legacy workspace or editor mounts.

import Konva from 'konva';
import { createNativeBoardCamera } from './board-native-camera';
import { createNativeBoardGrid } from './board-native-grid';
import {
    createNativeBoardGraphics,
    type NativeShapeKind,
} from './board-native-graphics';
import { attachNativeBoardInteractions } from './board-native-interactions';
import { attachNativeBoardDiagnostics } from './board-native-diagnostics';

export function createNativeBoardStage(
    host: HTMLDivElement,
    zoomLabel: HTMLSpanElement,
) {
    const stage = new Konva.Stage({
        container: host,
        id: crypto.randomUUID(),
        width: 1,
        height: 1,
    });
    const layer = new Konva.Layer();
    const styles = getComputedStyle(host);
    const grid = createNativeBoardGrid(
        stage,
        styles.getPropertyValue('--muted-foreground').trim() || styles.color,
    );
    layer.add(grid.node);
    const graphics = createNativeBoardGraphics(layer, styles.color);
    const camera = createNativeBoardCamera(stage);
    const selection = new Konva.Transformer({
        resizeEnabled: false,
        rotateEnabled: false,
        borderStroke: styles.color,
        borderStrokeWidth: 1.5,
        padding: 3,
    });
    layer.add(selection);
    const diagnostics = attachNativeBoardDiagnostics(
        stage,
        layer,
        graphics,
        grid.tile,
    );
    stage.add(layer);
    const interactions = attachNativeBoardInteractions({
        stage,
        camera,
        graphics,
        selection,
        host,
    });
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
            diagnostics.counters.resolutionChanges++;
        }
        //
        // Panning never enters this path; unchanged observer notifications must not clear or reallocate backing buffers.
        //
        if (stage.width() !== width || stage.height() !== height) {
            stage.size({ width, height });
            diagnostics.counters.viewportResizes++;
        }
    }

    const observer = new ResizeObserver(resizeViewport);
    observer.observe(host);
    window.addEventListener('resize', resizeViewport);
    resizeViewport();
    const themeObserver = new MutationObserver(() => {
        const nextStyles = getComputedStyle(host);
        graphics.recolor(nextStyles.color);
        selection.borderStroke(nextStyles.color);
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
        setTool: (tool: Parameters<typeof interactions.setTool>[0]) =>
            interactions.setTool(tool),
        toggleGrid: () => grid.node.visible(!grid.node.visible()),
        fit: () => camera.fit(graphics.store.getObjects()),
        insert(kind: NativeShapeKind) {
            const point = camera.worldPoint({
                x: stage.width() / 2 - 100,
                y: stage.height() / 2 - 100,
            });
            interactions.select(graphics.insert(kind, point));
            host.focus({ preventScroll: true });
        },
        replaceFixture(count: number) {
            interactions.cancel();
            interactions.select(null);
            graphics.replaceFixture(count);
            camera.reset();
        },
        snapshot: diagnostics.snapshot,
        dispose() {
            if (disposed) return;
            disposed = true;
            observer.disconnect();
            themeObserver.disconnect();
            window.removeEventListener('resize', resizeViewport);
            interactions.dispose();
            diagnostics.dispose();
            graphics.dispose();
            grid.dispose();
            stage.destroy();
        },
    };
}

export type NativeBoardStage = ReturnType<typeof createNativeBoardStage>;
