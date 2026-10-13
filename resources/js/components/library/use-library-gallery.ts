import { useEffect, useRef, useState } from 'react';
import {
    libraryFilterParams,
    libraryRequest,
    type LibraryFile,
    type LibraryFilters,
    type LibraryPageResult,
} from './library-api';
import {
    initialLibraryState,
    restoreLibraryScroll,
    saveLibraryState,
} from './library-browse-state';

export function useLibraryGallery(
    workspaceId: number,
    storageKey: string,
    imagesOnly: boolean,
    picker: boolean,
) {
    const [initial] = useState(() =>
        initialLibraryState(storageKey, imagesOnly, picker),
    );
    const [filters, setFilters] = useState<LibraryFilters>(initial.filters);
    const [files, setFiles] = useState<LibraryFile[]>([]);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState('');
    const [revision, setRevision] = useState(0);
    const generation = useRef(0);
    const requested = useRef('');
    const restored = useRef(false);
    const latest = useRef({ filters, pages });
    latest.current = { filters, pages };
    const params = libraryFilterParams(filters).toString();
    const base = `/workspaces/${workspaceId}/library`;
    useEffect(() => {
        const requestId = ++generation.current;
        const controller = new AbortController();
        let stopRestoring = () => {};
        setLoading(true);
        setLoadingMore(false);
        setError('');
        const timer = setTimeout(() => {
            const sameFilters = requested.current === params;
            requested.current = params;
            const pageCount =
                !restored.current &&
                params === libraryFilterParams(initial.filters).toString()
                    ? initial.pages
                    : sameFilters
                      ? latest.current.pages
                      : 1;
            Promise.all(
                Array.from({ length: pageCount }, (_, index) =>
                    libraryRequest<LibraryPageResult>(
                        `${base}/files?${params}&page=${index + 1}`,
                        { signal: controller.signal },
                    ),
                ),
            )
                .then((results) => {
                    if (requestId !== generation.current) return;
                    setFiles(results.flatMap((result) => result.files));
                    setTotal(results[0].total);
                    setPages(pageCount);
                    setHasMore(results.at(-1)?.has_more ?? false);
                    if (!restored.current && !picker)
                        stopRestoring = restoreLibraryScroll(initial.scroll);
                    restored.current = true;
                })
                .catch((failure: Error) => {
                    if (
                        !controller.signal.aborted &&
                        requestId === generation.current
                    )
                        setError(failure.message);
                })
                .finally(() => {
                    if (requestId === generation.current) setLoading(false);
                });
        }, 180);
        return () => {
            clearTimeout(timer);
            controller.abort();
            stopRestoring();
        };
    }, [base, params, initial, picker, revision]);

    useEffect(() => {
        if (picker) return;
        const save = () => {
            if (restored.current)
                saveLibraryState(storageKey, {
                    ...latest.current,
                    scroll: window.scrollY,
                });
        };
        let frame = 0;
        const scroll = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(save);
        };
        window.addEventListener('scroll', scroll, { passive: true });
        window.addEventListener('pagehide', save);
        return () => {
            save();
            cancelAnimationFrame(frame);
            window.removeEventListener('scroll', scroll);
            window.removeEventListener('pagehide', save);
        };
    }, [storageKey, picker]);

    async function loadMore() {
        if (loading || loadingMore || !hasMore || params !== requested.current)
            return;
        const requestId = generation.current;
        setLoadingMore(true);
        setError('');
        try {
            const result = await libraryRequest<LibraryPageResult>(
                `${base}/files?${params}&page=${pages + 1}`,
            );
            if (requestId !== generation.current) return;
            setFiles((previous) => [
                ...previous,
                ...result.files.filter(
                    (file) => !previous.some((old) => old.id === file.id),
                ),
            ]);
            setPages(result.page);
            setHasMore(result.has_more);
            setTotal(result.total);
        } catch (failure) {
            if (requestId === generation.current)
                setError(
                    failure instanceof Error
                        ? failure.message
                        : 'Could not load more files.',
                );
        } finally {
            if (requestId === generation.current) setLoadingMore(false);
        }
    }
    function rememberPosition() {
        if (!picker)
            saveLibraryState(storageKey, {
                filters,
                pages,
                scroll: window.scrollY,
            });
    }
    return {
        filters,
        setFilters,
        files,
        setFiles,
        total,
        setTotal,
        loading,
        loadingMore,
        hasMore,
        error,
        loadMore,
        rememberPosition,
        refresh: () => setRevision((value) => value + 1),
    };
}
