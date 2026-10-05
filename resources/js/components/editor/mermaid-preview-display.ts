import type { MermaidPreviewEntry } from './mermaid-preview-entry';

export function mountNextMermaidPreview(
    entry: MermaidPreviewEntry,
    near: Set<HTMLElement>,
    observed: boolean,
) {
    if (entry.state === 'reserve') {
        entry.state = 'display';
        // Reserve distant copies too, before they enter the SVG mounting window.
        if (entry.dimensions)
            for (const subscriber of entry.subscribers.values())
                subscriber({ dimensions: entry.dimensions });
        return;
    }
    entry.state = 'ready';
    for (const [element, subscriber] of entry.subscribers) {
        if (
            !element.isConnected ||
            element.dataset.mermaidEditing === 'true' ||
            (observed && !near.has(element)) ||
            entry.displayed.has(element)
        )
            continue;
        subscriber({ preview: entry.preview });
        entry.displayed.add(element);
        entry.state = 'display';
        break;
    }
}

export function showMermaidRenderError(entry: MermaidPreviewEntry) {
    entry.state = 'error';
    entry.error =
        'Diagram syntax could not be rendered. The source is preserved.';
    for (const subscriber of entry.subscribers.values())
        subscriber({ error: entry.error });
}
