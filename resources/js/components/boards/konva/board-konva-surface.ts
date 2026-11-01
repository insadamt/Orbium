// Summary: Owns one passive Konva visual plane without Stage event handlers or hit buffers; depends on explicit Board invalidation and the authoritative camera.

import Konva from 'konva';
import type { BoardBounds, BoardCamera } from '../board-types';

class BoardPaintLayer extends Konva.Layer {
    override batchDraw() {
        //
        // Board paint boundaries own scheduling; per-node automatic frames would paint twice and continue while hidden.
        //
        return this;
    }
}

export class BoardKonvaSurface {
    readonly host = document.createElement('div');
    readonly layer = new BoardPaintLayer({ listening: false });
    readonly world = new Konva.Group({ listening: false });
    dirty = true;
    private width = 0;
    private height = 0;
    private ratio = 0;

    constructor(parent: HTMLElement) {
        this.host.className = 'board-konva-surface';
        this.host.setAttribute('aria-hidden', 'true');
        this.host.append(this.layer.getNativeCanvasElement());
        this.layer.add(this.world);
        parent.append(this.host);
    }

    project(
        camera: BoardCamera,
        width: number,
        height: number,
        ratio: number,
        crop: BoardBounds = { x: 0, y: 0, width, height },
    ) {
        width = crop.width;
        height = crop.height;
        const canvas = this.layer.getCanvas();
        if (ratio !== this.ratio) {
            canvas.setPixelRatio(ratio);
            this.ratio = ratio;
        }
        if (width !== this.width || height !== this.height) {
            canvas.setSize(width, height);
            this.width = width;
            this.height = height;
        }
        Object.assign(this.host.style, {
            left: `${(crop.x - camera.x) / camera.zoom}px`,
            top: `${(crop.y - camera.y) / camera.zoom}px`,
            width: `${width / camera.zoom}px`,
            height: `${height / camera.zoom}px`,
        });
        this.world.position({ x: camera.x - crop.x, y: camera.y - crop.y });
        this.world.scale({ x: camera.zoom, y: camera.zoom });
        this.dirty = true;
    }

    draw() {
        if (!this.dirty) return;
        this.layer.drawScene();
        this.dirty = false;
    }

    destroy() {
        this.layer.destroy();
        this.host.remove();
    }

    pixels() {
        return (
            this.layer.getNativeCanvasElement().width *
            this.layer.getNativeCanvasElement().height
        );
    }
}
