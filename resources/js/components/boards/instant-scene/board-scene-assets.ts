import type { CachedPreview } from '@/components/editor/mermaid-preview-renderer';
import type { BoardObject } from '../board-types';
import { instantSceneBudgets } from './board-renderer-mode';

export type PreparedBoardVisual =
    | { kind: 'text'; template: HTMLElement }
    | { kind: 'diagram'; preview: CachedPreview }
    | { kind: 'native' }
    | { kind: 'error'; message: string };
type Entry = {
    object: BoardObject;
    visual: PreparedBoardVisual;
    bytes: number;
    nodes: number;
};

export function matchesPreparedRevision(
    before: BoardObject,
    after: BoardObject,
) {
    //
    // Geometry translations and measured heights do not change content; width and immutable data do affect its visual revision.
    //
    return (
        before.block_type === after.block_type &&
        before.data === after.data &&
        before.width === after.width
    );
}

export class BoardSceneAssets {
    private text = new Map<string, Entry>();
    private diagrams = new Map<string, Entry>();
    private bytes = { text: 0, diagrams: 0 };
    private textNodes = 0;
    evictions = 0;
    rejected = 0;

    reuseVisual(object: BoardObject) {
        const cache = this.cacheFor(object);
        const entry = cache.get(object.id);
        if (!entry || !matchesPreparedRevision(entry.object, object)) return;
        cache.delete(object.id);
        cache.set(object.id, entry);
        return entry.visual;
    }

    needsNativeFallback(object: BoardObject) {
        const entry = this.cacheFor(object).get(object.id);
        return Boolean(
            entry &&
            matchesPreparedRevision(entry.object, object) &&
            entry.visual.kind === 'native',
        );
    }

    remember(object: BoardObject, visual: PreparedBoardVisual) {
        this.remove(object.id);
        const category = object.block_type === 'mermaid' ? 'diagrams' : 'text';
        const cache = this[category];
        let bytes =
            visual.kind === 'text'
                ? visual.template.outerHTML.length * 2
                : visual.kind === 'diagram'
                  ? visual.preview.svg.length * 2
                  : visual.kind === 'error'
                    ? visual.message.length * 2
                    : 0;
        let nodes =
            visual.kind === 'text' ? this.countNodes(visual.template) : 0;
        const maximumBytes =
            category === 'text'
                ? instantSceneBudgets.textBytes
                : instantSceneBudgets.diagramBytes;
        const maximumEntries =
            category === 'text'
                ? instantSceneBudgets.textEntries
                : instantSceneBudgets.diagramEntries;
        if (bytes > maximumBytes || nodes > instantSceneBudgets.textNodes) {
            this.rejected++;
            //
            // Oversized SVGs must return to the native renderer instead of retrying an asset that can never enter this cache.
            //
            if (category !== 'diagrams') return;
            visual = { kind: 'native' };
            bytes = 0;
            nodes = 0;
        }
        cache.set(object.id, { object, visual, bytes, nodes });
        this.bytes[category] += bytes;
        this.textNodes += nodes;
        while (
            cache.size > maximumEntries ||
            this.bytes[category] > maximumBytes ||
            this.textNodes > instantSceneBudgets.textNodes
        ) {
            const oldest = cache.keys().next().value;
            if (!oldest) break;
            this.remove(oldest);
            this.evictions++;
        }
    }

    remove(id: string) {
        for (const category of ['text', 'diagrams'] as const) {
            const entry = this[category].get(id);
            if (!entry) continue;
            this.bytes[category] -= entry.bytes;
            this.textNodes -= entry.nodes;
            this[category].delete(id);
        }
    }

    clear() {
        this.text.clear();
        this.diagrams.clear();
        this.bytes = { text: 0, diagrams: 0 };
        this.textNodes = 0;
    }

    snapshot() {
        return {
            textEntries: this.text.size,
            diagramEntries: this.diagrams.size,
            estimatedBytes: { ...this.bytes },
            templateNodes: this.textNodes,
            evictions: this.evictions,
            rejected: this.rejected,
        };
    }

    private cacheFor(object: BoardObject) {
        return object.block_type === 'mermaid' ? this.diagrams : this.text;
    }

    private countNodes(root: Node) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_ALL);
        let count = 1;
        while (walker.nextNode()) count++;
        return count;
    }
}
