import { useCallback, useEffect, useState } from 'react';
import type { StatisticsSummary } from './statistics-types';

type Result = {
    url: string | null;
    data: StatisticsSummary | null;
    error: string | null;
    loading: boolean;
};

export function useStatistics(url: string | null) {
    const [refreshVersion, setRefreshVersion] = useState(0);
    const [result, setResult] = useState<Result>({
        url: null,
        data: null,
        error: null,
        loading: false,
    });
    const refresh = useCallback(
        () => setRefreshVersion((version) => version + 1),
        [],
    );

    useEffect(() => {
        if (!url) return;
        const controller = new AbortController();
        setResult((previous) => ({
            url,
            data: previous.url === url ? previous.data : null,
            error: null,
            loading: true,
        }));
        void fetch(url, {
            headers: { Accept: 'application/json' },
            signal: controller.signal,
            cache: 'no-store',
        })
            .then(async (response) => {
                if (!response.ok)
                    throw new Error(
                        response.status === 404
                            ? 'This item is unavailable.'
                            : 'Could not load statistics. Please try again.',
                    );
                const data = (await response.json()) as StatisticsSummary;
                if (!controller.signal.aborted)
                    setResult({ url, data, error: null, loading: false });
            })
            .catch((error: unknown) => {
                if (!controller.signal.aborted)
                    setResult((previous) => ({
                        url,
                        data: previous.url === url ? previous.data : null,
                        error:
                            error instanceof Error
                                ? error.message
                                : 'Could not load statistics.',
                        loading: false,
                    }));
            });
        return () => controller.abort();
    }, [url, refreshVersion]);

    return {
        ...(result.url === url
            ? result
            : { data: null, error: null, loading: Boolean(url) }),
        refresh,
    };
}
