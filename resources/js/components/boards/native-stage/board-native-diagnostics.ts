// Summary: Exposes on-demand native Stage counters and backing-buffer allocations without polling; depends on the installed Konva canvas APIs and explicit experiment mount.

import type Konva from 'konva';
import type { NativeBoardGraphics } from './board-native-graphics';

type NativeStageProbe = { snapshot: () => unknown };
declare global {
    interface Window {
        __ORBIUM_NATIVE_STAGES__?: Map<string, NativeStageProbe>;
    }
}

export function attachNativeBoardDiagnostics(
    stage: Konva.Stage,
    layer: Konva.Layer,
    graphics?: NativeBoardGraphics,
    gridTile?: HTMLCanvasElement,
) {
    const started = performance.now();
    const counters = {
        sceneDraws: 0,
        fullLayerPaints: 0,
        localizedPaints: 0,
        cameraAttributeChanges: 0,
        viewportResizes: 0,
        resolutionChanges: 0,
        inputEvents: 0,
        inputToSceneDrawSamples: 0,
        inputToSceneDrawTotalMs: 0,
        inputToSceneDrawMaxMs: 0,
        htmlOverlayUpdates: 0,
        sceneRebuilds: 0,
    };
    let lastInput: number | null = null;
    layer.on('draw.diagnostics', () => {
        counters.sceneDraws++;
        counters.fullLayerPaints++;
        if (lastInput !== null) {
            const delay = performance.now() - lastInput;
            counters.inputToSceneDrawSamples++;
            counters.inputToSceneDrawTotalMs += delay;
            counters.inputToSceneDrawMaxMs = Math.max(
                counters.inputToSceneDrawMaxMs,
                delay,
            );
            lastInput = null;
        }
    });
    stage.on(
        'xChange.diagnostics yChange.diagnostics scaleXChange.diagnostics',
        () => counters.cameraAttributeChanges++,
    );
    const recordInput = () => {
        counters.inputEvents++;
        lastInput = performance.now();
    };
    const controller = new AbortController();
    for (const name of ['pointerdown', 'pointermove', 'wheel'])
        stage.content.addEventListener(name, recordInput, {
            signal: controller.signal,
            passive: true,
        });

    function snapshot() {
        const layers = stage.getLayers();
        const canvases = layers.flatMap((item, index) => [
            {
                role: `layer-${index}-scene`,
                width: item.getCanvas().getWidth(),
                height: item.getCanvas().getHeight(),
                ratio: item.getCanvas().getPixelRatio(),
            },
            {
                role: `layer-${index}-hit`,
                width: item.getHitCanvas().getWidth(),
                height: item.getHitCanvas().getHeight(),
                ratio: item.getHitCanvas().getPixelRatio(),
            },
        ]);
        canvases.push({
            role: 'stage-lazy-hit-buffer',
            width: stage.bufferHitCanvas.getWidth(),
            height: stage.bufferHitCanvas.getHeight(),
            ratio: stage.bufferHitCanvas.getPixelRatio(),
        });
        if (gridTile)
            canvases.push({
                role: 'grid-pattern-tile',
                width: gridTile.width,
                height: gridTile.height,
                ratio: 1,
            });
        const allocatedPixels = canvases.reduce(
            (total, canvas) => total + canvas.width * canvas.height,
            0,
        );
        const memory = (
            performance as Performance & { memory?: { usedJSHeapSize: number } }
        ).memory;
        return {
            stageId: stage.id(),
            elapsedMs: performance.now() - started,
            konvaVersion: '10.9.1',
            ...counters,
            graphics: {
                ...graphics?.metrics,
                objects: graphics?.store.getObjects().length ?? 0,
            },
            visibleObjects: graphics
                ? graphics.store
                      .getObjects()
                      .filter(
                          (object) =>
                              object.x * stage.scaleX() + stage.x() <=
                                  stage.width() &&
                              (object.x + object.width) * stage.scaleX() +
                                  stage.x() >=
                                  0 &&
                              object.y * stage.scaleX() + stage.y() <=
                                  stage.height() &&
                              (object.y + object.height) * stage.scaleX() +
                                  stage.y() >=
                                  0,
                      ).length
                : 0,
            camera: { x: stage.x(), y: stage.y(), zoom: stage.scaleX() },
            viewport: stage.size(),
            canvases,
            allocatedPixels,
            estimatedRgbaBytes: allocatedPixels * 4,
            attachedCanvases: stage.content.querySelectorAll('canvas').length,
            totalNodes: stage.find('*').length + 1,
            pendingLayerDraws: layers.filter((item) => item._waitingForDraw)
                .length,
            heapBytes: memory?.usedJSHeapSize ?? 'unavailable',
            inputToSceneDrawMeanMs: counters.inputToSceneDrawSamples
                ? counters.inputToSceneDrawTotalMs /
                  counters.inputToSceneDrawSamples
                : null,
            cpu: 'unavailable',
            gpu: 'unavailable',
            temperature: 'unavailable',
            actualPresentationLatency: 'requires browser trace',
        };
    }

    const registry = (window.__ORBIUM_NATIVE_STAGES__ ??= new Map());
    registry.set(stage.id(), { snapshot });
    return {
        counters,
        snapshot,
        dispose() {
            controller.abort();
            layer.off('.diagnostics');
            stage.off('.diagnostics');
            registry.delete(stage.id());
            if (!registry.size && window.__ORBIUM_NATIVE_STAGES__ === registry)
                delete window.__ORBIUM_NATIVE_STAGES__;
        },
    };
}
