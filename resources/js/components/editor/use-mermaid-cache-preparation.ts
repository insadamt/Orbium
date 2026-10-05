import type { Editor } from '@tiptap/core';
import { useEffect, useRef, useState } from 'react';
import { csrfToken, documentUrl } from './editor-api';
import {
    getMermaidPreviewEntry,
    mermaidRendererVersion,
    type CachedPreview,
} from './mermaid-preview-renderer';
import type { SaveStatus } from './use-document-autosave';

export type SavedMermaidPreviews = Record<string, CachedPreview>;

type Progress = { completed: number; total: number };

function documentMermaidSources(editor: Editor): string[] {
    const sources = new Set<string>();
    editor.state.doc.descendants((node) => {
        if (node.type.name === 'mermaid') {
            sources.add(String(node.attrs.source ?? ''));
        }
    });
    return [...sources];
}

async function storeMermaidPreview(
    workspaceId: number,
    nodeId: number,
    source: string,
    preview: CachedPreview,
): Promise<void> {
    const response = await fetch(
        `${documentUrl(workspaceId, nodeId)}/mermaid-previews`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken(),
                Accept: 'application/json',
            },
            body: JSON.stringify({
                source,
                svg: preview.svg,
                renderId: preview.renderId,
                rendererVersion: mermaidRendererVersion,
            }),
        },
    );
    if (!response.ok) throw new Error('Could not save a diagram preview.');
}

export function useMermaidCachePreparation(
    editor: Editor | null,
    status: SaveStatus,
    savedPreviews: SavedMermaidPreviews,
    workspaceId: number,
    nodeId: number,
) {
    const [importPending, setImportPending] = useState(false);
    const [progress, setProgress] = useState<Progress | null>(null);
    const [cacheError, setCacheError] = useState('');
    const storedSources = useRef(new Set(Object.keys(savedPreviews)));
    const failedSources = useRef(new Set<string>());

    useEffect(() => {
        storedSources.current = new Set(Object.keys(savedPreviews));
        failedSources.current.clear();
    }, [savedPreviews, nodeId]);

    useEffect(() => {
        if (!editor || status !== 'saved') {
            if (status === 'error') {
                setImportPending(false);
                setProgress(null);
            }
            return;
        }
        if (importPending && editor.isEmpty) return;
        const currentSources = documentMermaidSources(editor);
        storedSources.current = new Set(
            [...storedSources.current].filter((source) =>
                currentSources.includes(source),
            ),
        );
        const missingSources = currentSources.filter(
            (source) =>
                !storedSources.current.has(source) &&
                !failedSources.current.has(source),
        );
        if (missingSources.length === 0) {
            setImportPending(false);
            setProgress(null);
            return;
        }

        let active = true;
        const showProgress = importPending || missingSources.length >= 10;
        if (showProgress)
            setProgress({ completed: 0, total: missingSources.length });

        const prepare = async () => {
            let failures = 0;
            for (const [index, source] of missingSources.entries()) {
                if (!active) return;
                await new Promise<void>((resolve) =>
                    window.setTimeout(resolve, 0),
                );
                try {
                    const preview = await getMermaidPreviewEntry(source);
                    if (!active) return;
                    await storeMermaidPreview(
                        workspaceId,
                        nodeId,
                        source,
                        preview,
                    );
                    storedSources.current.add(source);
                } catch {
                    failures += 1;
                    failedSources.current.add(source);
                }
                if (active && showProgress) {
                    setProgress({
                        completed: index + 1,
                        total: missingSources.length,
                    });
                }
            }
            if (active) {
                setCacheError(
                    failures > 0
                        ? `${failures} diagram preview${failures === 1 ? '' : 's'} could not be cached. The Mermaid source is preserved.`
                        : '',
                );
                setImportPending(false);
                setProgress(null);
            }
        };
        void prepare();
        return () => {
            active = false;
        };
    }, [editor, status, savedPreviews, importPending, workspaceId, nodeId]);

    return {
        beginImport: (diagramCount: number) => {
            setImportPending(true);
            setProgress({ completed: 0, total: diagramCount });
        },
        cancelImport: () => {
            setImportPending(false);
            setProgress(null);
        },
        progress,
        cacheError,
    };
}
