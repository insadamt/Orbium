import type { BoardObject, BoardPoint } from './board-types';

type StrokePoint = [number, number];
type Interval = [number, number];
export type ErasedStrokePreview = {
    original: BoardObject;
    fragments: StrokePoint[][];
};

type EraserSweep = { start: BoardPoint; end: BoardPoint; radius: number };

function circleInterval(
    start: BoardPoint,
    end: BoardPoint,
    center: BoardPoint,
    radius: number,
): Interval | null {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const ox = start.x - center.x;
    const oy = start.y - center.y;
    const a = dx * dx + dy * dy;
    const c = ox * ox + oy * oy - radius * radius;
    if (a < 1e-16) return c <= 0 ? [0, 1] : null;
    const b = 2 * (ox * dx + oy * dy);
    const discriminant = b * b - 4 * a * c;
    if (discriminant <= 0) return null;
    const root = Math.sqrt(discriminant);
    const left = Math.max(0, (-b - root) / (2 * a));
    const right = Math.min(1, (-b + root) / (2 * a));
    return left < right ? [left, right] : null;
}

function constrainInterval(
    interval: Interval,
    value: number,
    delta: number,
    lower: number,
    upper: number,
): Interval | null {
    if (Math.abs(delta) < 1e-12)
        return value >= lower && value <= upper ? interval : null;
    const a = (lower - value) / delta;
    const b = (upper - value) / delta;
    const left = Math.max(interval[0], Math.min(a, b));
    const right = Math.min(interval[1], Math.max(a, b));
    return left < right ? [left, right] : null;
}

function erasedIntervals(
    start: BoardPoint,
    end: BoardPoint,
    sweep: EraserSweep,
) {
    const intervals: Interval[] = [];
    for (const center of [sweep.start, sweep.end]) {
        const interval = circleInterval(start, end, center, sweep.radius);
        if (interval) intervals.push(interval);
    }
    const dx = sweep.end.x - sweep.start.x;
    const dy = sweep.end.y - sweep.start.y;
    const length = Math.hypot(dx, dy);
    if (length > 1e-8) {
        const ux = dx / length;
        const uy = dy / length;
        const px = start.x - sweep.start.x;
        const py = start.y - sweep.start.y;
        const vx = end.x - start.x;
        const vy = end.y - start.y;
        const along = constrainInterval(
            [0, 1],
            px * ux + py * uy,
            vx * ux + vy * uy,
            0,
            length,
        );
        const strip =
            along &&
            constrainInterval(
                along,
                -px * uy + py * ux,
                -vx * uy + vy * ux,
                -sweep.radius,
                sweep.radius,
            );
        if (strip) intervals.push(strip);
    }
    //
    // Clip the entire swept capsule, not just sampled pointer circles, so fast erasing cannot leave gaps.
    //
    const merged: Interval[] = [];
    for (const interval of intervals.sort((a, b) => a[0] - b[0])) {
        const previous = merged.at(-1);
        if (previous && interval[0] <= previous[1])
            previous[1] = Math.max(previous[1], interval[1]);
        else merged.push([...interval]);
    }
    return merged;
}

export function eraseStrokeFragments(
    preview: ErasedStrokePreview,
    sweep: EraserSweep,
): StrokePoint[][] | null {
    const object = preview.original;
    const drawing = object.data.drawing!;
    const scaleX = object.width / drawing.view_width;
    const scaleY = object.height / drawing.view_height;
    const radius =
        sweep.radius + (drawing.stroke_width / 2) * Math.max(scaleX, scaleY);
    if (
        Math.max(sweep.start.x, sweep.end.x) + radius < object.x ||
        Math.min(sweep.start.x, sweep.end.x) - radius >
            object.x + object.width ||
        Math.max(sweep.start.y, sweep.end.y) + radius < object.y ||
        Math.min(sweep.start.y, sweep.end.y) - radius > object.y + object.height
    )
        return null;
    const worldPoint = ([x, y]: StrokePoint) => ({
        x: object.x + x * scaleX,
        y: object.y + y * scaleY,
    });
    const result: StrokePoint[][] = [];
    let changed = false;
    for (const fragment of preview.fragments) {
        if (fragment.length === 1) {
            const point = worldPoint(fragment[0]);
            if (erasedIntervals(point, point, { ...sweep, radius }).length)
                changed = true;
            else result.push(fragment);
            continue;
        }
        let run: StrokePoint[] = [];
        const flush = () => {
            if (run.length) result.push(run);
            run = [];
        };
        for (let index = 1; index < fragment.length; index++) {
            const start = fragment[index - 1];
            const end = fragment[index];
            const intervals = erasedIntervals(
                worldPoint(start),
                worldPoint(end),
                { ...sweep, radius },
            );
            if (!intervals.length) {
                if (!run.length) run.push(start);
                run.push(end);
                continue;
            }
            changed = true;
            const interpolate = (t: number): StrokePoint => [
                start[0] + (end[0] - start[0]) * t,
                start[1] + (end[1] - start[1]) * t,
            ];
            let position = 0;
            for (const [left, right] of intervals) {
                if (left > position) {
                    if (!run.length) run.push(interpolate(position));
                    run.push(interpolate(left));
                }
                flush();
                position = right;
            }
            if (position < 1) run.push(interpolate(position), end);
        }
        flush();
    }
    return changed ? result : null;
}

export function createErasedStrokeObject({
    original,
    fragments,
}: ErasedStrokePreview): BoardObject | null {
    if (!fragments.length) return null;
    const points: StrokePoint[] = [];
    const breaks: number[] = [];
    for (const fragment of fragments) {
        if (points.length) breaks.push(points.length);
        points.push(...fragment);
    }
    const drawing = { ...original.data.drawing!, points };
    delete drawing.breaks;
    if (breaks.length) drawing.breaks = breaks;
    //
    // Keep gaps inside the original object so erase never changes its identity, selection frame or resize scale.
    //
    return { ...original, data: { ...original.data, drawing } };
}
