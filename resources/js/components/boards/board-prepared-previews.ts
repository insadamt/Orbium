import type { ContentOwnerKind } from '@/components/editor/editor-api';
import {
    renderMermaidPreview,
    sanitizeMermaidPreview,
    type CachedPreview,
} from '@/components/editor/mermaid-preview-renderer';

const maximumPreparedBytes = 4 * 1024 * 1024;
const maximumPreparedDiagrams = 128;

export class BoardPreparedPreviews {
    readonly mathScope = {};
    private diagrams = new Map<
        string,
        { preview: CachedPreview; bytes: number }
    >();
    private bytes = 0;

    reuseDiagram(ownerKind: ContentOwnerKind, nodeId: number, source: string) {
        const key = this.diagramKey(ownerKind, nodeId, source);
        const entry = this.diagrams.get(key);
        if (!entry) return;
        this.diagrams.delete(key);
        this.diagrams.set(key, entry);
        return entry.preview;
    }

    async renderNativeDiagram(
        nodeId: number,
        source: string,
        shouldRender: () => boolean,
    ) {
        const cached = this.reuseDiagram('board', nodeId, source);
        if (cached) return cached;
        const rendered = await renderMermaidPreview(source, shouldRender);
        if (!rendered) return null;
        //
        // A render already in progress cannot be interrupted; keep its sanitized result even if its card was just culled.
        //
        const sanitized = await sanitizeMermaidPreview(rendered);
        if (sanitized) this.rememberDiagram('board', nodeId, source, sanitized);
        return sanitized;
    }

    rememberDiagram(
        ownerKind: ContentOwnerKind,
        nodeId: number,
        source: string,
        preview: CachedPreview,
    ) {
        const key = this.diagramKey(ownerKind, nodeId, source);
        const existing = this.diagrams.get(key);
        if (existing?.preview === preview) return;
        if (existing) this.removeDiagram(key);
        const bytes =
            (key.length + preview.svg.length + preview.renderId.length) * 2;
        if (bytes > maximumPreparedBytes) return;
        this.diagrams.set(key, { preview, bytes });
        this.bytes += bytes;
        //
        // Retain sanitized results rather than live DOM/editors, with a byte limit for long traversals.
        //
        while (
            this.diagrams.size > maximumPreparedDiagrams ||
            this.bytes > maximumPreparedBytes
        ) {
            const oldest = this.diagrams.keys().next().value;
            if (oldest === undefined) break;
            this.removeDiagram(oldest);
        }
    }

    private diagramKey(
        ownerKind: ContentOwnerKind,
        nodeId: number,
        source: string,
    ) {
        return `${ownerKind}:${nodeId}:${source}`;
    }

    private removeDiagram(key: string) {
        const entry = this.diagrams.get(key);
        if (!entry) return;
        this.diagrams.delete(key);
        this.bytes -= entry.bytes;
    }
}
