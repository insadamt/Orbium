import type { ContentOwnerKind } from '@/components/editor/editor-api';
import { useEffect, useRef, useState, type Ref } from 'react';
import { ImagePlus, RefreshCw, Upload } from 'lucide-react';
import {
    libraryRequest,
    type LibraryFile,
    type LibraryPageResult,
} from '@/components/library/library-api';
import { IconResultsGrid, type IconGridHandle } from './icon-results-grid';
import { inlineIconLabel, type InlineIconChoice } from './icon-catalog';

export function CustomIconBrowser({
    workspaceId,
    nodeId,
    query,
    disabled,
    onChoose,
    onPreview,
    onUpload,
    gridRef,
    ownerKind,
}: {
    workspaceId: number;
    nodeId: number;
    query: string;
    disabled: boolean;
    onChoose: (choice: InlineIconChoice) => void;
    onPreview: (choice: InlineIconChoice) => void;
    onUpload: () => void;
    gridRef: Ref<IconGridHandle>;
    ownerKind?: ContentOwnerKind;
}) {
    const [files, setFiles] = useState<LibraryFile[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [retry, setRetry] = useState(0);
    const requestNumber = useRef(0);

    useEffect(() => {
        const request = ++requestNumber.current;
        const controller = new AbortController();
        setFiles([]);
        setPage(1);
        setLoading(true);
        setError('');
        const timer = window.setTimeout(
            () => {
                const params = new URLSearchParams({
                    q: query.trim(),
                    type: 'images',
                    sort: 'newest',
                    page: '1',
                });
                void libraryRequest<LibraryPageResult>(
                    `/workspaces/${workspaceId}/library/files?${params}`,
                    { signal: controller.signal },
                )
                    .then((result) => {
                        if (request !== requestNumber.current) return;
                        setFiles(result.files);
                        setHasMore(result.has_more);
                    })
                    .catch((failure: unknown) => {
                        if (!controller.signal.aborted)
                            setError(
                                failure instanceof Error
                                    ? failure.message
                                    : 'Could not load your icons.',
                            );
                    })
                    .finally(() => {
                        if (request === requestNumber.current)
                            setLoading(false);
                    });
            },
            query ? 150 : 0,
        );
        return () => {
            clearTimeout(timer);
            controller.abort();
            requestNumber.current++;
        };
    }, [workspaceId, query, retry]);

    async function loadMore() {
        if (loading || disabled) return;
        const request = requestNumber.current;
        const nextPage = page + 1;
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams({
                q: query.trim(),
                type: 'images',
                sort: 'newest',
                page: String(nextPage),
            });
            const result = await libraryRequest<LibraryPageResult>(
                `/workspaces/${workspaceId}/library/files?${params}`,
            );
            if (request !== requestNumber.current) return;
            setFiles((current) => [
                ...current,
                ...result.files.filter(
                    (file) =>
                        !current.some((existing) => existing.id === file.id),
                ),
            ]);
            setHasMore(result.has_more);
            setPage(nextPage);
        } catch (failure) {
            if (request === requestNumber.current)
                setError(
                    failure instanceof Error
                        ? failure.message
                        : 'Could not load more icons.',
                );
        } finally {
            if (request === requestNumber.current) setLoading(false);
        }
    }
    const choices: InlineIconChoice[] = files.map((file) => ({
        kind: 'custom',
        attachmentId: file.id,
        label: inlineIconLabel(file.name),
    }));
    return (
        <div className="custom-icon-browser">
            <div className="custom-icon-actions">
                <span>Images from your workspace</span>
                <button type="button" disabled={disabled} onClick={onUpload}>
                    <Upload size={14} /> Upload
                </button>
            </div>
            {error && (
                <div role="alert" className="icon-picker-message">
                    {error}
                    <button
                        type="button"
                        onClick={() => setRetry((value) => value + 1)}
                    >
                        <RefreshCw size={14} /> Retry
                    </button>
                </div>
            )}
            {choices.length ? (
                <IconResultsGrid
                    key={query}
                    choices={choices}
                    ownerKind={ownerKind}
                    workspaceId={workspaceId}
                    nodeId={nodeId}
                    disabled={disabled}
                    onChoose={onChoose}
                    onPreview={onPreview}
                    imageUrls={
                        new Map(
                            files.map((file) => [file.id, file.thumbnail_url]),
                        )
                    }
                    gridRef={gridRef}
                />
            ) : (
                <div className="icon-picker-empty">
                    <ImagePlus size={28} />
                    <strong>
                        {loading
                            ? 'Loading your images…'
                            : query
                              ? 'No matching images'
                              : 'Make it yours'}
                    </strong>
                    <span>
                        {query
                            ? 'Try a different filename.'
                            : 'Upload an image to use as an inline icon.'}
                    </span>
                    {!loading && !query && (
                        <button
                            type="button"
                            className="icon-upload-primary"
                            disabled={disabled}
                            onClick={onUpload}
                        >
                            <Upload size={15} /> Upload an icon
                        </button>
                    )}
                </div>
            )}
            {hasMore && (
                <button
                    type="button"
                    className="icon-load-more"
                    disabled={loading || disabled}
                    onClick={() => void loadMore()}
                >
                    {loading ? 'Loading…' : 'Load more images'}
                </button>
            )}
        </div>
    );
}
