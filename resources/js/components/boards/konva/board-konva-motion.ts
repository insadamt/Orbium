// Summary: Mirrors finite existing WAAPI graphic feedback into Konva; depends on BoardMotionEffects events and native animation progress, with no permanent frame loop.

import type { BoardKonvaGraphic } from './board-konva-geometry';

type GraphicMotion = {
    animation: Animation;
    frames: Keyframe[];
    graphic: BoardKonvaGraphic;
};

export class BoardKonvaMotion {
    private running = new Map<string, GraphicMotion>();
    private styles = new Map<
        string,
        {
            graphic: BoardKonvaGraphic;
            started: number;
            from: { color: string; width: number };
            to: { color: string; width: number };
            fromRgb: number[];
            toRgb: number[];
        }
    >();

    transitionStyle(previous: BoardKonvaGraphic, graphic: BoardKonvaGraphic) {
        if (this.styles.size >= 48 && !this.styles.has(graphic.object.id))
            return;
        const from = previous.readAppearance();
        const to = graphic.readAppearance();
        if (
            (from.color === to.color && from.width === to.width) ||
            window.matchMedia('(prefers-reduced-motion: reduce)').matches
        )
            return;
        graphic.updateAppearance(from);
        this.styles.set(graphic.object.id, {
            graphic,
            started: performance.now(),
            from,
            to,
            fromRgb: canvasRgb(from.color),
            toRgb: canvasRgb(to.color),
        });
    }

    start(
        id: string,
        graphic: BoardKonvaGraphic,
        animation: Animation,
        frames: Keyframe[],
    ) {
        this.running.set(id, { graphic, animation, frames });
    }

    paint() {
        const dirty = new Set<BoardKonvaGraphic>();
        for (const [id, style] of this.styles) {
            const progress = Math.min(
                1,
                (performance.now() - style.started) / 160,
            );
            const eased = cssEase(progress);
            style.graphic.updateAppearance(
                progress === 1
                    ? style.to
                    : {
                          color: `rgb(${style.fromRgb.map((value, axis) => value + (style.toRgb[axis] - value) * eased).join(',')})`,
                          width:
                              style.from.width +
                              (style.to.width - style.from.width) * eased,
                      },
            );
            dirty.add(style.graphic);
            if (progress === 1) {
                style.graphic.finishAppearance();
                this.styles.delete(id);
            }
        }
        for (const [id, motion] of this.running) {
            const { graphic, animation, frames } = motion;
            const progress = animation.effect?.getComputedTiming().progress;
            const geometry = graphic.readGeometry();
            graphic.updateGeometry(geometry);
            if (
                progress === null ||
                progress === undefined ||
                animation.playState === 'finished' ||
                animation.playState === 'idle'
            ) {
                graphic.node.opacity(graphic.object.data.drawing?.opacity ?? 1);
                this.running.delete(id);
            } else {
                const from = frames[0];
                const to = frames.at(-1)!;
                const interpolate = (
                    name: 'opacity' | 'scale',
                    fallback: number,
                ) =>
                    Number(from[name] ?? fallback) +
                    (Number(to[name] ?? fallback) -
                        Number(from[name] ?? fallback)) *
                        progress;
                const scale = interpolate('scale', 1);
                const node = graphic.node;
                const centerX = geometry.x + geometry.width / 2;
                const centerY = geometry.y + geometry.height / 2;
                node.position({
                    x: centerX + (node.x() - centerX) * scale,
                    y:
                        centerY +
                        (node.y() - centerY) * scale +
                        (from.translate ? 4 * (1 - progress) : 0),
                });
                node.scale({
                    x: node.scaleX() * scale,
                    y: node.scaleY() * scale,
                });
                node.opacity(
                    interpolate('opacity', 1) *
                        (graphic.object.data.drawing?.opacity ?? 1),
                );
            }
            dirty.add(graphic);
        }
        return {
            dirty,
            pending: this.running.size > 0 || this.styles.size > 0,
        };
    }

    clear() {
        for (const style of this.styles.values())
            style.graphic.finishAppearance();
        this.styles.clear();
        for (const { graphic } of this.running.values()) {
            graphic.updateGeometry(graphic.readGeometry());
            graphic.node.opacity(graphic.object.data.drawing?.opacity ?? 1);
        }
        this.running.clear();
    }
}

function canvasRgb(color: string) {
    //
    // Resolve theme colors once per transition on a one-pixel software surface, never through per-frame GPU readback.
    //
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d', { willReadFrequently: true })!;
    context.fillStyle = color;
    context.fillRect(0, 0, 1, 1);
    return Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3);
}

function cssEase(progress: number) {
    let low = 0;
    let high = 1;
    for (let index = 0; index < 12; index++) {
        const t = (low + high) / 2;
        const x =
            3 * (1 - t) ** 2 * t * 0.25 + 3 * (1 - t) * t ** 2 * 0.25 + t ** 3;
        if (x < progress) low = t;
        else high = t;
    }
    const t = (low + high) / 2;
    return 3 * (1 - t) ** 2 * t * 0.1 + 3 * (1 - t) * t ** 2 + t ** 3;
}
