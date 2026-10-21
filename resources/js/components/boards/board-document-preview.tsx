import { useEffect, useRef, useState } from 'react';
import { serializeDocumentAsMarkdown } from '@/components/editor/markdown-export';
import { renderRichBody } from '@/components/editor/markdown/rich/render-rich-body';
import {
    useBoardDocumentSnapshots,
    useBoardWorkScheduler,
    useBoardPreparedPreviews,
} from './board-resource-previews';
import { fetchResourceDocument } from './board-resource-api';
import type { BoardLocation } from './board-types';
import type { BoardResource, ResourceDocument } from './board-resource-types';
import { createBoardRichPreviewQueue } from './board-rich-preview-queue';
import { BoardMermaidPreviewSession } from './board-mermaid-preview-session';

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
    const scheduler = useBoardWorkScheduler();
    const prepared = useBoardPreparedPreviews();
    const appliedRefreshVersion = useRef(refreshVersion);
    const [snapshot, setSnapshot] = useState<ResourceDocument | null>(() =>
        documents.read(resource.id, resource.revision),
    );
    const [error, setError] = useState('');
    const { workspaceId, boardId } = location;
    const { id: targetId, revision } = resource;
    const currentSnapshot = snapshot?.id === targetId ? snapshot : null;

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
        //
        // Keep the last readable revision during refresh, but never carry content across a different resource target.
        //
        setSnapshot((current) => (current?.id === targetId ? current : null));
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
        const cancelQueuedPreview = scheduler.enqueue(
            'fetch',
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
            () => (visible ? 0 : 1),
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
        scheduler,
    ]);

    useEffect(() => {
        const output = host.current;
        if (!output) return;
        output.replaceChildren();
        if (!currentSnapshot) return;
        //
        // Render against the original Document so attachments and mentions keep their existing ownership.
        //
        const mermaid = new BoardMermaidPreviewSession(
            { workspaceId, nodeId: currentSnapshot.id, ownerKind: 'document' },
            prepared,
        );
        const richQueue = createBoardRichPreviewQueue(output, scheduler);
        const source =
            currentSnapshot.content_format_version === 2
                ? currentSnapshot.markdown
                : serializeDocumentAsMarkdown(
                      currentSnapshot.title,
                      currentSnapshot.content,
                      {
                          workspaceId,
                          nodeId: currentSnapshot.id,
                          origin: window.location.origin,
                      },
                  );
        const dispose = renderRichBody(
            output,
            source,
            {
                workspaceId,
                nodeId: currentSnapshot.id,
                mermaid,
                mathPreviewScope: prepared.mathScope,
                metadata: new Map(),
                documentSourceRanges:
                    currentSnapshot.content_format_version === 2,
                schedulePreview: (element, render) =>
                    richQueue.enqueue(element, render),
                isVisible: () => output.isConnected,
                onUpload: () => {},
            },
            () => {},
        );
        if (!source.trim())
            output.textContent = 'Empty Document · double-click to edit';
        mermaid.start(output);
        return () => {
            richQueue.destroy();
            dispose();
            mermaid.destroy();
            output.replaceChildren();
        };
    }, [currentSnapshot, workspaceId, scheduler, prepared]);

    return (
        <div
            className="board-document-preview orbium-editor orbium-markdown-content"
            data-document-styles
            data-preview-ready={Boolean(currentSnapshot)}
        >
            {error ? (
                <p role="alert">{error}</p>
            ) : !currentSnapshot ? (
                <p role="status">Rendering Document…</p>
            ) : null}
            <div ref={host} />
        </div>
    );
}
