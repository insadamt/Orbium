import type { MermaidPreviewDimensions } from './mermaid-preview-entry';
import type { CachedPreview } from './mermaid-preview-renderer';

function positivePixelLength(value: string | null): number | undefined {
    if (!value || !/^\s*\d+(?:\.\d+)?(?:px)?\s*$/.test(value)) return;
    const length = Number.parseFloat(value);
    return Number.isFinite(length) && length > 0 ? length : undefined;
}

export function readMermaidPreviewDimensions(
    preview: CachedPreview,
): MermaidPreviewDimensions | undefined {
    const svg = new DOMParser().parseFromString(
        preview.svg,
        'image/svg+xml',
    ).documentElement;
    if (svg.localName !== 'svg') return;
    const viewBox = svg
        .getAttribute('viewBox')
        ?.trim()
        .split(/[\s,]+/)
        .map(Number);
    const width =
        viewBox?.[2] ?? positivePixelLength(svg.getAttribute('width'));
    const height =
        viewBox?.[3] ?? positivePixelLength(svg.getAttribute('height'));
    if (
        !width ||
        !height ||
        !Number.isFinite(width) ||
        !Number.isFinite(height) ||
        width <= 0 ||
        height <= 0
    )
        return;
    const maximumWidth = svg
        .getAttribute('style')
        ?.match(/(?:^|;)\s*max-width\s*:\s*([\d.]+px)\s*(?:;|$)/i)?.[1];
    return {
        width,
        height,
        maxWidth:
            positivePixelLength(maximumWidth ?? null) ??
            positivePixelLength(svg.getAttribute('width')),
    };
}

export function applyMermaidPreviewDimensions(
    output: HTMLElement,
    dimensions: MermaidPreviewDimensions,
) {
    output.style.aspectRatio = `${dimensions.width} / ${dimensions.height}`;
    output.style.width = '100%';
    output.style.maxWidth = dimensions.maxWidth
        ? `${dimensions.maxWidth}px`
        : '';
}

export function clearMermaidPreviewDimensions(output: HTMLElement) {
    output.style.removeProperty('aspect-ratio');
    output.style.removeProperty('width');
    output.style.removeProperty('max-width');
}
