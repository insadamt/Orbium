import { useId, type RefObject } from 'react';
import { ExternalLink, RefreshCw, X } from 'lucide-react';
import {
    insightLabels,
    type StatisticsInsight,
} from './statistics-insight-types';
import {
    StatisticsOrganizationInsights,
    StatisticsWritingInsights,
    StatisticsTaskInsights,
} from './statistics-content-insights';
import { StatisticsBlockInsights } from './statistics-block-insights';
import { StatisticsUploadInsights } from './statistics-upload-insights';
import { openLocation } from '@/components/navigation/tab-navigation';
import type { StatisticsSummary } from './statistics-types';

export function StatisticsInsightPage({
    data,
    metric,
    pageRef,
    onClose,
    onRefresh,
    loading,
    error,
    pageUrl,
}: {
    data: StatisticsSummary;
    metric: StatisticsInsight;
    pageRef: RefObject<HTMLElement | null>;
    onClose?: () => void;
    onRefresh: () => void;
    loading: boolean;
    error: string | null;
    pageUrl?: string;
}) {
    const titleId = useId();
    return (
        <section
            ref={pageRef}
            tabIndex={-1}
            aria-labelledby={titleId}
            className="floating-body-island statistics-insight-page"
            onKeyDown={(event) => {
                if (
                    onClose &&
                    event.key === 'Escape' &&
                    !event.defaultPrevented
                ) {
                    event.preventDefault();
                    event.stopPropagation();
                    onClose();
                }
            }}
        >
            <header className="statistics-insight-header">
                <div className="min-w-0">
                    <h1
                        id={titleId}
                        className="text-2xl font-semibold tracking-tight"
                    >
                        {insightLabels[metric]}
                    </h1>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                        {data.scope.name}
                    </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                    <button
                        type="button"
                        className="statistics-insight-close"
                        aria-label="Refresh insights"
                        title="Refresh insights"
                        disabled={loading}
                        onClick={onRefresh}
                    >
                        <RefreshCw size={16} aria-hidden="true" />
                    </button>
                    {pageUrl && (
                        <a
                            href={pageUrl}
                            className="statistics-insight-close"
                            aria-label="Open insights page"
                            title="Open insights page"
                            onClick={(event) => {
                                if (
                                    event.ctrlKey ||
                                    event.metaKey ||
                                    event.shiftKey ||
                                    event.altKey
                                )
                                    return;
                                event.preventDefault();
                                openLocation(pageUrl, true);
                            }}
                        >
                            <ExternalLink size={16} aria-hidden="true" />
                        </a>
                    )}
                    {onClose && (
                        <button
                            type="button"
                            className="statistics-insight-close"
                            aria-label="Close insights"
                            title="Close insights"
                            onClick={onClose}
                        >
                            <X size={17} aria-hidden="true" />
                        </button>
                    )}
                </div>
            </header>
            {loading && (
                <p role="status" className="text-xs text-muted-foreground">
                    Refreshing…
                </p>
            )}
            {error && (
                <p role="alert" className="text-sm">
                    {error} Showing the last loaded totals.
                </p>
            )}
            <div className="statistics-insight-body" key={metric}>
                {metric === 'organization' && (
                    <StatisticsOrganizationInsights data={data} />
                )}
                {metric === 'words' && (
                    <StatisticsWritingInsights data={data} />
                )}
                {metric === 'blocks' && <StatisticsBlockInsights data={data} />}
                {metric === 'tasks' && <StatisticsTaskInsights data={data} />}
                {(metric === 'storage' || metric === 'uploads') && (
                    <StatisticsUploadInsights data={data} metric={metric} />
                )}
            </div>
        </section>
    );
}
