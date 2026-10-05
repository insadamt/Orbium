import type { MermaidPreviewEntry } from './mermaid-preview-entry';

export function mountNextMermaidPreview(
    entry: MermaidPreviewEntry,
    near: Set<HTMLElement>,
    observed: boolean,
) {
    entry.state = 'ready';
    for (const [element, subscriber] of entry.subscribers) {
        if (
            !element.isConnected ||
            element.dataset.mermaidEditing === 'true' ||
            (observed && !near.has(element)) ||
            entry.displayed.has(element)
        )
            continue;
        subscriber(entry.preview);
        entry.displayed.add(element);
        entry.state = 'display';
        break;
    }
}
