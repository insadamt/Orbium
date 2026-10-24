import { getStrokePoints } from 'perfect-freehand';
import { boardLimits, type BoardPoint } from './board-types';
import { simplifyBoardDrawingPoints } from './board-drawing-simplification';

export type BoardDrawingSmoothing = 'off' | 'light' | 'strong';
const smoothingProfiles = {
    light: { streamline: 0.5, cleanupPixels: 1.5 },
    strong: { streamline: 0.75, cleanupPixels: 6 },
} as const;
type StrokePoint = [number, number];
type QuadraticSection = {
    start: StrokePoint;
    control: StrokePoint;
    end: StrokePoint;
    samples: number;
};

function midpoint(first: StrokePoint, second: StrokePoint): StrokePoint {
    return [(first[0] + second[0]) / 2, (first[1] + second[1]) / 2];
}

function isSharpTurn(
    previous: StrokePoint,
    point: StrokePoint,
    next: StrokePoint,
) {
    const incoming = [point[0] - previous[0], point[1] - previous[1]];
    const outgoing = [next[0] - point[0], next[1] - point[1]];
    const lengths = Math.hypot(...incoming) * Math.hypot(...outgoing);
    return (
        lengths > 0 &&
        (incoming[0] * outgoing[0] + incoming[1] * outgoing[1]) / lengths < 0.25
    );
}

function quadraticSampleCount(
    start: StrokePoint,
    control: StrokePoint,
    end: StrokePoint,
    zoom: number,
) {
    const curvature = Math.hypot(
        start[0] - 2 * control[0] + end[0],
        start[1] - 2 * control[1] + end[1],
    );
    const tolerancePixels = 0.2;
    return Math.max(
        1,
        Math.ceil(Math.sqrt((curvature * zoom) / (4 * tolerancePixels))),
    );
}

function buildQuadraticSections(
    points: StrokePoint[],
    zoom: number,
): QuadraticSection[] {
    const sections: QuadraticSection[] = [];
    let start = points[0];
    for (let index = 1; index < points.length - 1; index++) {
        const control = points[index];
        const next = points[index + 1];
        //
        // Preserve pointed turns rather than rounding away details in handwriting and zigzags.
        //
        if (isSharpTurn(points[index - 1], control, next)) {
            sections.push({
                start,
                control: midpoint(start, control),
                end: control,
                samples: 1,
            });
            start = control;
            continue;
        }
        const end = midpoint(control, next);
        sections.push({
            start,
            control,
            end,
            samples: quadraticSampleCount(start, control, end, zoom),
        });
        start = end;
    }
    return sections;
}

function sampleQuadraticSection(
    section: QuadraticSection,
    samples: number,
    output: StrokePoint[],
) {
    for (let index = 1; index <= samples; index++) {
        const progress = index / samples;
        const remaining = 1 - progress;
        output.push([
            remaining * remaining * section.start[0] +
                2 * remaining * progress * section.control[0] +
                progress * progress * section.end[0],
            remaining * remaining * section.start[1] +
                2 * remaining * progress * section.control[1] +
                progress * progress * section.end[1],
        ]);
    }
}

export function prepareBoardDrawingPoints({
    points,
    endpoint,
    smoothing,
    zoom,
    pointLimit,
}: {
    points: StrokePoint[];
    endpoint: BoardPoint | null;
    smoothing: BoardDrawingSmoothing;
    zoom: number;
    pointLimit: number;
}): StrokePoint[] {
    if (!points.length) return [];
    let controls = [...points];
    const last = controls[controls.length - 1];
    //
    // The live tail reaches the actual pointer in every frame, so release never snaps a delayed filter to a new endpoint.
    //
    if (endpoint && (endpoint.x !== last[0] || endpoint.y !== last[1]))
        controls.push([endpoint.x, endpoint.y]);
    if (smoothing === 'off' || controls.length < 3) return controls;
    controls = getStrokePoints(controls, {
        size: 2 / zoom,
        streamline: smoothingProfiles[smoothing].streamline,
        thinning: 0,
        simulatePressure: false,
        last: true,
    }).map((sample) => sample.point);
    //
    // Curving every dense input point preserves the original wobble; first remove deviations at the selected screen-space scale.
    //
    controls = simplifyBoardDrawingPoints(
        controls,
        smoothingProfiles[smoothing].cleanupPixels / zoom,
    );
    if (controls.length < 3) return controls;
    //
    // Prepare enough curve detail for later zooming, even when the stroke was drawn in a zoomed-out view.
    //
    const sections = buildQuadraticSections(
        controls,
        Math.max(zoom, boardLimits.maxZoom),
    );
    const desiredExtraSamples = sections.reduce(
        (total, section) => total + section.samples - 1,
        0,
    );
    const availableExtraSamples = Math.max(0, pointLimit - controls.length);
    const sampleRatio = desiredExtraSamples
        ? Math.min(1, availableExtraSamples / desiredExtraSamples)
        : 0;
    let carriedSamples = 0;
    const output: StrokePoint[] = [controls[0]];
    for (const section of sections) {
        //
        // Bake curves within the existing point budget; older renderers, clipboard and eraser consume the exact same geometry.
        //
        carriedSamples += (section.samples - 1) * sampleRatio;
        const extraSamples = Math.floor(carriedSamples);
        carriedSamples -= extraSamples;
        sampleQuadraticSection(section, 1 + extraSamples, output);
    }
    output.push(controls[controls.length - 1]);
    return output;
}
