import { measureEditorWork } from '@/lib/editor-performance';
import type { MermaidPreviewEntry } from './mermaid-preview-entry';
import { rankMermaidElements } from './mermaid-viewport';

type PreparationViewport = {
    entries: Iterable<MermaidPreviewEntry>;
    near: Set<HTMLElement>;
    observed: boolean;
    scrollContainer: HTMLElement | null;
    direction: number;
};

export function rankMermaidPreparationEntries(viewport: PreparationViewport) {
    return measureEditorWork('mermaid.priorities', () => rankEntries(viewport));
}

function rankEntries(viewport: PreparationViewport) {
    const root = viewport.scrollContainer?.getBoundingClientRect();
    const ranked: {
        entry: MermaidPreviewEntry;
        rank: number;
        distance: number;
    }[] = [];
    for (const entry of viewport.entries) {
        if (
            entry.subscribers.size === 0 ||
            !['pending', 'cached', 'render', 'reserve', 'display'].includes(
                entry.state,
            )
        )
            continue;
        const elements = [...entry.subscribers.keys()].filter(
            (element) =>
                element.dataset.mermaidEditing !== 'true' &&
                (entry.state !== 'display' || !entry.displayed.has(element)),
        );
        if (elements.length === 0) continue;
        const priority = rankMermaidElements(
            elements,
            viewport.near,
            viewport.observed,
            root,
            viewport.direction,
        );
        if (entry.state === 'display' && priority.rank === 3) continue;
        ranked.push({ entry, ...priority });
    }
    return ranked.sort(
        (a, b) =>
            a.rank - b.rank ||
            Number(b.entry.state === 'display') -
                Number(a.entry.state === 'display') ||
            a.distance - b.distance ||
            a.entry.queuedAt - b.entry.queuedAt,
    );
}
