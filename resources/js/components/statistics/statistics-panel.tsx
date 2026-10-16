import type { StatisticsInsight } from './statistics-insight-types';
import { RefreshCw } from 'lucide-react';
import { formatCount } from './statistics-charts';
import type { useStatistics } from './use-statistics';

import { StatisticsOverview } from './statistics-overview';
import { StatisticsCountingRules } from './statistics-counting-rules';

export function StatisticsPanel({
    result,
    selectedMetric,
    onInspect,
}: {
    result: ReturnType<typeof useStatistics>;
    selectedMetric: StatisticsInsight | null;
    onInspect: (metric: StatisticsInsight, trigger: HTMLButtonElement) => void;
}) {
    const { data, error, loading, refresh } = result;
    return (
        <section
            aria-label="Statistics"
            aria-busy={loading}
            className="space-y-5"
        >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
                <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                        {data?.scope.name ?? 'Your content'}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={refresh}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent disabled:opacity-50"
                >
                    <RefreshCw size={15} aria-hidden="true" />
                    Refresh
                </button>
            </div>
            {loading && !data && (
                <div role="status" className="space-y-5">
                    <p className="text-sm text-muted-foreground">
                        Loading statistics…
                    </p>
                    <div
                        aria-hidden="true"
                        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
                    >
                        {[0, 1, 2, 3].map((key) => (
                            <div
                                key={key}
                                className="h-32 rounded-2xl bg-muted/60"
                            />
                        ))}
                    </div>
                </div>
            )}
            {loading && data && (
                <p role="status" className="text-xs text-muted-foreground">
                    Refreshing saved totals…
                </p>
            )}
            {error && (
                <div
                    role="alert"
                    className="rounded-xl border border-border p-5 text-sm"
                >
                    <p>{error}</p>
                    {data && (
                        <p className="mt-2 text-muted-foreground">
                            Showing the last loaded totals.
                        </p>
                    )}
                    <button
                        type="button"
                        onClick={refresh}
                        className="mt-3 rounded-lg bg-accent px-3 py-2"
                    >
                        Try again
                    </button>
                </div>
            )}
            {data && (
                <>
                    {!data.completeness.complete && (
                        <div
                            role="status"
                            className="rounded-xl border border-border bg-accent/40 p-4 text-sm"
                        >
                            <p className="font-medium">Updating statistics</p>
                            <p className="mt-1 text-muted-foreground">
                                {formatCount(
                                    data.completeness.pending_documents,
                                )}{' '}
                                documents still need processing. Unavailable
                                totals show —. Refresh to check again.
                            </p>
                        </div>
                    )}
                    <StatisticsOverview
                        data={data}
                        onInspect={onInspect}
                        selectedMetric={selectedMetric}
                    />
                    <StatisticsCountingRules data={data} />
                </>
            )}
        </section>
    );
}
