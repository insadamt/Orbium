import { useEffect, useRef, useState } from 'react';
import { serializeDocumentAsMarkdown } from '@/components/editor/markdown-export';
import { MermaidPreviewSession } from '@/components/editor/mermaid-preview-session';
import { renderRichBody } from '@/components/editor/markdown/rich/render-rich-body';
import { useBoardDocumentSnapshots } from './board-resource-previews';
import { scheduleBoardDocumentPreview } from './board-preview-queue';
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
    const documents = useBoardDocumentSnapshots();
    const appliedRefreshVersion = useRef(refreshVersion);
    const [snapshot, setSnapshot] = useState<ResourceDocument | null>(() =>
        documents.read(resource.id, resource.revision),
    );
    const [error, setError] = useState('');
    const { workspaceId, boardId } = location;
    const { id: targetId, revision } = resource;

    useEffect(() => {
        const controller = new AbortController();
        setError('');
        const forcedRefresh = appliedRefreshVersion.current !== refreshVersion;
        appliedRefreshVersion.current = refreshVersion;
        const cached = forcedRefresh
            ? null
            : documents.read(targetId, revision);
        if (cached) {
            setSnapshot(cached);
            onLoaded(cached);
            return;
        }
        setSnapshot(null);
        let visible = typeof IntersectionObserver === 'undefined';
        const observer =
            typeof IntersectionObserver === 'undefined'
                ? null
                : new IntersectionObserver(
                      (entries) => {
                          visible = entries.some(
                              (entry) => entry.isIntersecting,
                          );
                      },
                      { root: host.current?.closest('.board-canvas') ?? null },
                  );
        const card = host.current?.closest('[data-board-object-id]');
        if (card) observer?.observe(card);
        const cancelQueuedPreview = scheduleBoardDocumentPreview(
            async () => {
                await fetchResourceDocument(
                    { workspaceId, boardId },
                    targetId,
                    controller.signal,
                )
                    .then((document) => {
                        if (!controller.signal.aborted) {
                            documents.remember(document);
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
            },
            () => visible,
        );
        return () => {
            observer?.disconnect();
            cancelQueuedPreview();
            controller.abort();
        };
    }, [
        workspaceId,
        boardId,
        targetId,
        revision,
        refreshVersion,
        onLoaded,
        documents,
    ]);

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
