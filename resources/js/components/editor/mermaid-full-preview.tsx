import { openContentFullPreview } from './content-full-preview';
import { readMermaidPreviewDimensions } from './mermaid-preview-layout';
import {
    instantiateMermaidSvg,
    type CachedPreview,
} from './mermaid-preview-renderer';

export function openMermaidFullPreview(
    preview: CachedPreview,
    trigger: HTMLElement,
): () => void {
    const content = document.createElement('div');
    content.className = 'mermaid-full-svg';
    content.innerHTML = instantiateMermaidSvg(preview);
    return openContentFullPreview({
        content,
        dimensions: readMermaidPreviewDimensions(preview) ?? {
            width: 800,
            height: 600,
        },
        title: 'Diagram preview',
        canvasLabel:
            'Diagram canvas. Use plus and minus to zoom, arrow keys to pan, and zero to fit.',
        fitLabel: 'Fit diagram to view',
        trigger,
    });
}
