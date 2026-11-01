// Summary: Coordinates bounded, ordered Konva planes over canonical Board records; depends on the existing camera, native cards and imperative gesture bridge, never persistence.

import type { BoardRecordStore } from '../board-record-store';
import type { BoardObject } from '../board-types';
import type { BoardCameraController } from '../use-board-camera';
import {
    attachBoardGraphics,
    type BoardGraphicsBridge,
} from './board-graphics-bridge';
import {
    boardGraphicsFallback,
    boardBandViewport,
    boardKonvaBudgets,
    composeBoardGraphics,
} from './board-konva-composition';
import {
    createBoardGraphic,
    type BoardKonvaGraphic,
} from './board-konva-geometry';
import { BoardKonvaMotion } from './board-konva-motion';
import { BoardKonvaBarriers } from './board-konva-barriers';
import { BoardKonvaPreview } from './board-konva-preview';
import { BoardKonvaSurface } from './board-konva-surface';

export class BoardKonvaScene implements BoardGraphicsBridge {
    active = true;
    private viewport: HTMLElement | null = null;
    private world: HTMLElement | null = null;
    private surfaces = new Map<string, BoardKonvaSurface>();
    private graphics = new Map<string, BoardKonvaGraphic>();
    private preview: BoardKonvaPreview | null = null;
    private presentedIds: string[] = [];
    private selectedIds: readonly string[] = [];
    private hoveredId: string | null = null;
    private foreground = '#000000';
    private width = 0;
    private height = 0;
    private ratio = 1;
    private frame: number | undefined;
    private motion = new BoardKonvaMotion();
    private barriers = new BoardKonvaBarriers(() => this.rebuild());
    private listeners = new Set<() => void>();
    private fallback: string | null = null;
    private failed = false;
    private counters = {
        sceneDraws: 0,
        cameraPaints: 0,
        geometryPaints: 0,
        eraserPaints: 0,
    };

    constructor(
        private store: BoardRecordStore,
        private camera: Pick<BoardCameraController, 'cameraRef'>,
    ) {}

    readonly subscribe = (listener: () => void) => {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    };
    readonly getActive = () => this.active;

    connect(viewport: HTMLElement, world: HTMLElement) {
        this.viewport = viewport;
        this.world = world;
        const detach = attachBoardGraphics(viewport, this);
        const measure = () => {
            this.width = viewport.clientWidth;
            this.height = viewport.clientHeight;
            this.ratio = Math.min(
                boardKonvaBudgets.pixelRatio,
                window.devicePixelRatio || 1,
            );
            this.paintCamera();
        };
        const resize = new ResizeObserver(measure);
        resize.observe(viewport);
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
        const stopMotion = () => {
            this.motion.clear();
            this.invalidateAll();
        };
        reduced.addEventListener('change', stopMotion);
        const theme = new MutationObserver(() => {
            this.foreground = getComputedStyle(viewport).color;
            for (const graphic of this.graphics.values())
                graphic.updateColor(this.foreground);
            this.preview?.updateColor(this.foreground);
            this.invalidateAll();
        });
        theme.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class', 'style', 'data-theme'],
        });
        const unsubscribe = this.store.subscribeChanges((ids) => {
            for (const id of ids) {
                const kind = this.store.getObject(id)?.block_type;
                if (
                    kind === 'drawing' ||
                    kind === 'shape' ||
                    this.graphics.has(id)
                ) {
                    this.rebuild();
                    break;
                }
            }
        });
        const hover = (event: PointerEvent) => {
            const element =
                event.type === 'pointerout'
                    ? event.relatedTarget
                    : event.target;
            const id =
                element instanceof Element
                    ? (element.closest<HTMLElement>(
                          '[data-board-kind="drawing"]',
                      )?.dataset.boardObjectId ?? null)
                    : null;
            if (id === this.hoveredId) return;
            this.hoveredId = id;
            this.barriers.update([...this.selectedIds, ...(id ? [id] : [])]);
            this.rebuild();
        };
        const motion = (event: Event) => {
            if (!this.active || !(event.target instanceof Element)) return;
            const id = event.target.closest<HTMLElement>(
                '[data-board-object-id]',
            )?.dataset.boardObjectId;
            const graphic = id ? this.graphics.get(id) : undefined;
            if (!graphic) return;
            const detail = (
                event as CustomEvent<{
                    animation: Animation;
                    frames: Keyframe[];
                }>
            ).detail;
            this.motion.start(id!, graphic, detail.animation, detail.frames);
            this.schedule();
        };
        const visibility = () => {
            if (document.hidden) {
                if (this.frame !== undefined) cancelAnimationFrame(this.frame);
                this.frame = undefined;
                this.motion.clear();
            } else {
                measure();
                this.invalidateAll();
            }
        };
        viewport.addEventListener('pointerover', hover);
        viewport.addEventListener('pointerout', hover);
        viewport.addEventListener('board-graphic-motion', motion);
        document.addEventListener('visibilitychange', visibility);
        window.addEventListener('resize', measure);
        this.foreground = getComputedStyle(viewport).color;
        measure();
        return () => {
            detach();
            unsubscribe();
            resize.disconnect();
            reduced.removeEventListener('change', stopMotion);
            theme.disconnect();
            viewport.removeEventListener('pointerover', hover);
            viewport.removeEventListener('pointerout', hover);
            viewport.removeEventListener('board-graphic-motion', motion);
            document.removeEventListener('visibilitychange', visibility);
            window.removeEventListener('resize', measure);
            if (this.frame !== undefined) cancelAnimationFrame(this.frame);
            this.frame = undefined;
            this.destroyGraphics();
            this.barriers.dispose();
            this.viewport = null;
            this.world = null;
            this.setActive(false);
        };
    }

    updatePresentation(objects: BoardObject[], selectedIds: readonly string[]) {
        this.presentedIds = objects.map((object) => object.id);
        this.selectedIds = selectedIds;
        this.barriers.update([
            ...selectedIds,
            ...(this.hoveredId ? [this.hoveredId] : []),
        ]);
        this.rebuild();
    }

    paintCamera = () => {
        if (document.hidden) return;
        this.counters.cameraPaints++;
        this.rebuild(true);
    };

    paintObjects = (objects: BoardObject[]) => {
        if (!this.active || document.hidden) return;
        this.counters.geometryPaints++;
        for (const object of objects) {
            const graphic = this.graphics.get(object.id);
            if (!graphic) continue;
            graphic.updateGeometry(object);
            this.markGraphicDirty(graphic);
        }
        const bands = [...this.surfaces].map(([key, surface]) => ({
            key,
            zIndex: Number(surface.host.style.zIndex),
            objects: this.surfaceObjects(surface),
        }));
        const fallback = boardGraphicsFallback(
            bands,
            this.camera.cameraRef.current,
            this.width,
            this.height,
            this.ratio,
        );
        if (fallback) {
            this.fallbackToOriginal(fallback);
            return;
        }
        for (const surface of this.surfaces.values())
            if (surface.dirty) this.project(surface);
        this.flush();
    };

    paintStroke: BoardGraphicsBridge['paintStroke'] = (preview) => {
        if (!this.active || document.hidden) return;
        this.preview?.paintStroke(preview);
    };

    paintPath: BoardGraphicsBridge['paintPath'] = (points, hover, brush) => {
        if (!this.active || document.hidden) return;
        this.preview?.paintPath(points, hover, brush);
    };

    paintErasure: BoardGraphicsBridge['paintErasure'] = (id, fragments) => {
        const graphic = this.graphics.get(id);
        if (!graphic || !this.active) return;
        this.counters.eraserPaints++;
        graphic.replaceFragments(fragments);
        this.markGraphicDirty(graphic);
        this.schedule();
    };

    snapshot() {
        return {
            ...this.counters,
            active: this.active,
            fallback: this.fallback,
            bands: this.surfaces.size,
            graphicNodes: this.graphics.size,
            pixelRatio: this.ratio,
            scenePixels: [...this.surfaces.values()].reduce(
                (pixels, surface) => pixels + surface.pixels(),
                this.preview?.surface.pixels() ?? 0,
            ),
            queuedFrame: this.frame !== undefined,
        };
    }

    private rebuild(cameraChanged = false) {
        if (this.failed) return;
        try {
            this.rebuildGraphics(cameraChanged);
        } catch {
            this.failed = true;
            this.fallbackToOriginal('canvas-unavailable');
        }
    }

    private rebuildGraphics(cameraChanged: boolean) {
        if (!this.viewport || !this.world || document.hidden) return;
        if (typeof Path2D === 'undefined' || typeof DOMMatrix === 'undefined') {
            this.failed = true;
            this.fallbackToOriginal('canvas-unavailable');
            return;
        }
        const objects = this.presentedIds.flatMap((id) => {
            const object = this.store.getObject(id);
            return object ? [object] : [];
        });
        const barriers = this.barriers.read();
        const bands = composeBoardGraphics(objects, barriers);
        this.fallback = boardGraphicsFallback(
            bands,
            this.camera.cameraRef.current,
            this.width,
            this.height,
            this.ratio,
        );
        this.viewport.dataset.boardGraphics = this.fallback
            ? 'original'
            : 'konva';
        this.viewport.dataset.boardGraphicsFallback = this.fallback ?? '';
        if (this.fallback) {
            this.fallbackToOriginal(this.fallback);
            return;
        }
        const liveSurfaces = new Set(bands.map((band) => band.key));
        const liveGraphics = new Set(
            bands.flatMap((band) => band.objects.map((object) => object.id)),
        );
        for (const [id, graphic] of this.graphics) {
            if (liveGraphics.has(id)) continue;
            this.markGraphicDirty(graphic);
            graphic.node.destroy();
            this.graphics.delete(id);
        }
        for (const band of bands) {
            let surface = this.surfaces.get(band.key);
            if (!surface) {
                const spare = [...this.surfaces].find(
                    ([key]) => !liveSurfaces.has(key),
                );
                surface = spare?.[1] ?? new BoardKonvaSurface(this.world);
                if (spare) this.surfaces.delete(spare[0]);
                this.surfaces.set(band.key, surface);
                this.project(surface);
            }
            surface.host.style.zIndex = String(band.zIndex);
            band.objects.forEach((object, index) => {
                let graphic = this.graphics.get(object.id);
                if (!graphic || graphic.object.data !== object.data) {
                    const previous = graphic;
                    if (graphic) this.markGraphicDirty(graphic);
                    graphic?.node.destroy();
                    graphic = createBoardGraphic(object, this.foreground);
                    if (previous?.object.data.drawing && object.data.drawing) {
                        this.motion.transitionStyle(previous, graphic);
                        this.schedule();
                    }
                    this.graphics.set(object.id, graphic);
                    surface!.dirty = true;
                } else if (graphic.object !== object) {
                    graphic.object = object;
                    graphic.updateGeometry(object);
                    surface!.dirty = true;
                }
                if (graphic.node.parent !== surface!.world) {
                    const previous = graphic.node.parent;
                    for (const other of this.surfaces.values())
                        if (other.world === previous) other.dirty = true;
                    graphic.node.moveTo(surface!.world);
                    surface!.dirty = true;
                }
                if (graphic.node.zIndex() !== index) {
                    graphic.node.zIndex(index);
                    surface!.dirty = true;
                }
            });
        }
        //
        // Reparent surviving nodes before disposing obsolete bands; otherwise Layer.destroy would destroy their shared nodes too.
        //
        for (const [key, surface] of this.surfaces) {
            if (liveSurfaces.has(key)) continue;
            surface.destroy();
            this.surfaces.delete(key);
        }
        if (!this.preview) {
            this.preview = new BoardKonvaPreview(this.world);
            this.preview.updateColor(this.foreground);
            this.project(this.preview.surface);
        }
        for (const surface of this.surfaces.values())
            if (surface.dirty || cameraChanged) this.project(surface);
        if (cameraChanged && this.preview) this.project(this.preview.surface);
        this.setActive(true);
        this.flush();
    }

    private project(surface: BoardKonvaSurface) {
        const camera = this.camera.cameraRef.current;
        const objects = this.surfaceObjects(surface);
        surface.project(
            camera,
            this.width,
            this.height,
            this.ratio,
            surface === this.preview?.surface
                ? undefined
                : boardBandViewport(objects, camera, this.width, this.height),
        );
    }

    private surfaceObjects(surface: BoardKonvaSurface) {
        return surface.world.children.flatMap((node) => {
            const graphic = this.graphics.get(node.id());
            return graphic ? [graphic.readGeometry()] : [];
        });
    }

    private fallbackToOriginal(reason: string) {
        this.fallback = reason;
        if (this.viewport) {
            this.viewport.dataset.boardGraphics = 'original';
            this.viewport.dataset.boardGraphicsFallback = reason;
        }
        this.destroyGraphics();
        this.setActive(false);
    }

    private setActive(active: boolean) {
        if (this.active === active) return;
        this.active = active;
        this.listeners.forEach((listener) => listener());
        this.viewport?.dispatchEvent(new Event('board-graphics-change'));
    }

    private markGraphicDirty(graphic: BoardKonvaGraphic) {
        for (const surface of this.surfaces.values())
            if (graphic.node.parent === surface.world) surface.dirty = true;
    }

    private invalidateAll() {
        for (const surface of this.surfaces.values()) surface.dirty = true;
        this.schedule();
    }

    private schedule() {
        if (this.frame !== undefined || document.hidden) return;
        this.frame = requestAnimationFrame(() => {
            this.frame = undefined;
            const motion = this.motion.paint();
            for (const graphic of motion.dirty) this.markGraphicDirty(graphic);
            this.flush();
            if (motion.pending) this.schedule();
        });
    }

    private flush() {
        if (document.hidden) return;
        for (const surface of this.surfaces.values()) {
            if (surface.dirty) this.counters.sceneDraws++;
            surface.draw();
        }
        this.preview?.surface.draw();
    }

    private destroyGraphics() {
        if (this.frame !== undefined) cancelAnimationFrame(this.frame);
        this.frame = undefined;
        this.motion.clear();
        for (const graphic of this.graphics.values()) graphic.node.destroy();
        this.graphics.clear();
        for (const surface of this.surfaces.values()) surface.destroy();
        this.surfaces.clear();
        this.preview?.destroy();
        this.preview = null;
    }
}
