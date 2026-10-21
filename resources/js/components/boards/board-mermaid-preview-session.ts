import type { ContentOwnerKind } from '@/components/editor/editor-api';
import type { MermaidSubscriber } from '@/components/editor/mermaid-preview-entry';
import { readMermaidPreviewDimensions } from '@/components/editor/mermaid-preview-layout';
import { MermaidPreviewSession } from '@/components/editor/mermaid-preview-session';
import type { BoardPreparedPreviews } from './board-prepared-previews';

type PreviewOwner = {
    workspaceId: number;
    nodeId: number;
    ownerKind: ContentOwnerKind;
};

export class BoardMermaidPreviewSession extends MermaidPreviewSession {
    private stopRemembering: () => void;

    constructor(
        private owner: PreviewOwner,
        private prepared: BoardPreparedPreviews,
    ) {
        super(owner.workspaceId, owner.nodeId, owner.ownerKind);
        this.stopRemembering = this.previews.subscribePrepared(() => {
            for (const entry of this.previews.values()) {
                if (entry.sanitized && entry.preview)
                    prepared.rememberDiagram(
                        owner.ownerKind,
                        owner.nodeId,
                        entry.source,
                        entry.preview,
                    );
            }
        });
    }

    override register(
        source: string,
        element: HTMLElement,
        subscriber: MermaidSubscriber,
    ) {
        const cached = this.prepared.reuseDiagram(
            this.owner.ownerKind,
            this.owner.nodeId,
            source,
        );
        if (cached) {
            const entry = this.previews.prepareSource(source);
            //
            // Only sanitized results from this mounted Board enter this path; register can display them immediately.
            //
            entry.preview = cached;
            entry.sanitized = true;
            entry.dimensions = readMermaidPreviewDimensions(cached);
            entry.state = 'ready';
        }
        return super.register(source, element, subscriber);
    }

    override destroy() {
        this.stopRemembering();
        super.destroy();
    }
}
