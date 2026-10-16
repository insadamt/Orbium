import '../../../css/statistics.css';
import { Head, usePage } from '@inertiajs/react';
import { useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { openLocation } from '@/components/navigation/tab-navigation';
import { StatisticsInsightPage } from '@/components/statistics/statistics-insight-page';
import {
    insightLabels,
    type StatisticsInsight,
} from '@/components/statistics/statistics-insight-types';
import { parseStatisticsLocation } from '@/components/statistics/statistics-location';
import { useStatistics } from '@/components/statistics/use-statistics';

export default function StatisticsInsightsPage() {
    const page = usePage<{ statisticsInsight: StatisticsInsight }>();
    const { params, dataUrl } = parseStatisticsLocation(page.url);
    const result = useStatistics(dataUrl);
    const pageRef = useRef<HTMLElement | null>(null);
    const metric = page.props.statisticsInsight;
    const backUrl = `/statistics${params.size ? `?${params}` : ''}`;
    return (
        <div className="statistics-insight-standalone">
            <Head title={`${insightLabels[metric]} statistics`} />
            <button
                type="button"
                className="statistics-insight-back"
                onClick={() => openLocation(backUrl)}
            >
                <ArrowLeft size={15} aria-hidden="true" />
                Statistics
            </button>
            {result.data ? (
                <StatisticsInsightPage
                    data={result.data}
                    metric={metric}
                    pageRef={pageRef}
                    onRefresh={result.refresh}
                    loading={result.loading}
                    error={result.error}
                />
            ) : (
                <section
                    className="floating-body-island statistics-insight-page"
                    aria-label={`${insightLabels[metric]} statistics`}
                >
                    <h1 className="text-2xl font-semibold">
                        {insightLabels[metric]}
                    </h1>
                    {result.loading && (
                        <p
                            role="status"
                            className="mt-6 text-sm text-muted-foreground"
                        >
                            Loading statistics…
                        </p>
                    )}
                    {result.error && (
                        <div role="alert" className="mt-6 space-y-4 text-sm">
                            <p>{result.error}</p>
                            <button
                                type="button"
                                onClick={result.refresh}
                                className="statistics-insight-text-button"
                            >
                                Try again
                            </button>
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}
