import { useEffect, useRef, useState } from 'react';
import { serializeDocumentAsMarkdown } from '@/components/editor/markdown-export';
import { MermaidPreviewSession } from '@/components/editor/mermaid-preview-session';
import { renderRichBody } from '@/components/editor/markdown/rich/render-rich-body';
import { fetchResourceDocument } from './board-resource-api';
import type { BoardLocation } from './board-types';
import type { BoardResource, ResourceDocument } from './board-resource-types';

export function BoardDocumentPreview({
    location,
    resource,
    refreshVersion,
    onLoaded,
}: {
    location: BoardLocation;
    resource: BoardResource;
    refreshVersion: number;
    onLoaded: (snapshot: ResourceDocument) => void;
}) {
    const host = useRef<HTMLDivElement>(null);
    const [snapshot, setSnapshot] = useState<ResourceDocument | null>(null);
    const [error, setError] = useState('');
    const { workspaceId, boardId } = location;
    const { id: targetId, revision } = resource;

    useEffect(() => {
        const controller = new AbortController();
        setSnapshot(null);
        setError('');
        void fetchResourceDocument(
            { workspaceId, boardId },
            targetId,
            controller.signal,
        )
            .then((document) => {
                if (!controller.signal.aborted) {
                    setSnapshot(document);
                    onLoaded(document);
                }
            })
            .catch((failure) => {
                if (!controller.signal.aborted)
                    setError(
                        failure instanceof Error
                            ? failure.message
                            : 'Could not render this Document.',
                    );
            });
        return () => controller.abort();
    }, [workspaceId, boardId, targetId, revision, refreshVersion, onLoaded]);

    useEffect(() => {
        const output = host.current;
        if (!output || !snapshot) return;
        output.replaceChildren();
        //
        // Render against the original Document so attachments and mentions keep their existing ownership.
        //
        const mermaid = new MermaidPreviewSession(workspaceId, snapshot.id);
        const source =
            snapshot.content_format_version === 2
                ? snapshot.markdown
                : serializeDocumentAsMarkdown(
                      snapshot.title,
                      snapshot.content,
                      {
                          workspaceId,
                          nodeId: snapshot.id,
                          origin: window.location.origin,
                      },
                  );
        const dispose = renderRichBody(
            output,
            source,
            {
                workspaceId,
                nodeId: snapshot.id,
                mermaid,
                metadata: new Map(),
                documentSourceRanges: snapshot.content_format_version === 2,
                isVisible: () => output.isConnected,
                onUpload: () => {},
            },
            () => {},
        );
        if (!source.trim())
            output.textContent = 'Empty Document · double-click to edit';
        mermaid.start(output);
        return () => {
            dispose();
            mermaid.destroy();
            output.replaceChildren();
        };
    }, [snapshot, workspaceId]);

    return (
        <div
            className="board-document-preview orbium-editor orbium-markdown-content"
            data-document-styles
            data-preview-ready={Boolean(snapshot)}
        >
            {error ? (
                <p role="alert">{error}</p>
            ) : !snapshot ? (
                <p role="status">Rendering Document…</p>
            ) : null}
            <div ref={host} />
        </div>
    );
}
