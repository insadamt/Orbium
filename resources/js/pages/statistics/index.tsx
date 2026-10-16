import '../../../css/statistics.css';
import { Head, usePage } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { AppSelect } from '@/components/ui/app-select';
import { StatisticsInsightPage } from '@/components/statistics/statistics-insight-page';
import { useStatistics } from '@/components/statistics/use-statistics';
import type { StatisticsInsight } from '@/components/statistics/statistics-insight-types';
import {
    parseStatisticsLocation,
    statisticsInsightUrl,
} from '@/components/statistics/statistics-location';
import { StatisticsPanel } from '@/components/statistics/statistics-panel';
import {
    activateTab,
    openLocation,
} from '@/components/navigation/tab-navigation';
import { useNavigation } from '@/components/navigation/navigation-store';

export default function StatisticsPage() {
    const pageRef = useRef<HTMLDivElement>(null);
    const page = usePage<{
        statisticsWorkspaces: { id: number; name: string }[];
    }>();
    const {
        params,
        selection,
        hasPage,
        dataUrl: url,
    } = parseStatisticsLocation(page.url);
    const result = useStatistics(url);
    const [insightSelection, setInsightSelection] = useState<{
        scopeUrl: string;
        metric: StatisticsInsight;
    } | null>(null);
    const selectedMetric =
        insightSelection?.scopeUrl === url ? insightSelection.metric : null;
    const insightRef = useRef<HTMLElement | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const returnUrl = params.get('return');
    const canReturn =
        returnUrl && /^\/workspaces\/\d+(?:[/?]|$)/.test(returnUrl);

    function inspectMetric(
        metric: StatisticsInsight,
        trigger: HTMLButtonElement,
    ) {
        if (window.matchMedia('(max-width: 1023px)').matches) {
            openLocation(statisticsInsightUrl(metric, params));
            return;
        }
        triggerRef.current = trigger;
        setInsightSelection({ scopeUrl: url, metric });
        requestAnimationFrame(() =>
            insightRef.current?.focus({ preventScroll: true }),
        );
    }

    function closeInsights() {
        setInsightSelection(null);
        if (
            triggerRef.current?.isConnected &&
            !triggerRef.current.closest('[hidden]')
        )
            triggerRef.current.focus();
        else pageRef.current?.focus({ preventScroll: true });
    }

    function changeScope(value: string) {
        setInsightSelection(null);
        params.set(
            'scope',
            value === 'page'
                ? 'page'
                : value === 'account'
                  ? 'account'
                  : 'workspace',
        );
        if (value.startsWith('workspace:')) {
            // Keep the originating page available when viewing a different workspace.
            params.set('selected_workspace', value.slice(10));
        } else params.delete('selected_workspace');
        openLocation(`/statistics?${params}`);
    }

    function returnToSource() {
        if (!canReturn) return;
        const sourceTab = useNavigation
            .getState()
            .tabs.find((tab) => tab.entries[tab.index].url === returnUrl);
        if (sourceTab) activateTab(sourceTab.id);
        else openLocation(returnUrl);
    }

    return (
        <div
            className="statistics-pages"
            data-insights-open={selectedMetric !== null}
        >
            <div
                ref={pageRef}
                tabIndex={-1}
                className="floating-body-island statistics-page mx-auto space-y-5"
            >
                <Head title="Statistics" />
                <header className="space-y-5">
                    {canReturn && (
                        <button
                            type="button"
                            onClick={returnToSource}
                            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft size={15} aria-hidden="true" /> Back to{' '}
                            {params.get('title') || 'workspace'}
                        </button>
                    )}
                    <div className="flex flex-wrap items-center justify-between gap-5">
                        <div className="flex min-w-0 items-center gap-3">
                            <div>
                                <h1 className="text-2xl font-semibold tracking-tight">
                                    Statistics
                                </h1>
                            </div>
                        </div>
                        <div className="w-full space-y-2 sm:w-auto">
                            <AppSelect
                                label="Statistics scope"
                                value={selection}
                                onValueChange={changeScope}
                                options={[
                                    ...(hasPage
                                        ? [
                                              {
                                                  value: 'page',
                                                  label: `This page · ${params.get('title') || 'Page'}`,
                                              },
                                          ]
                                        : []),
                                    {
                                        value: 'account',
                                        label: 'All workspaces',
                                    },
                                    ...page.props.statisticsWorkspaces.map(
                                        (workspace) => ({
                                            value: `workspace:${workspace.id}`,
                                            label: workspace.name,
                                        }),
                                    ),
                                ]}
                            />
                        </div>
                    </div>
                </header>
                <StatisticsPanel
                    result={result}
                    selectedMetric={selectedMetric}
                    onInspect={inspectMetric}
                />
            </div>
            <div
                className="statistics-insight-slot"
                inert={selectedMetric === null}
                aria-hidden={selectedMetric === null}
            >
                {result.data && (
                    <StatisticsInsightPage
                        data={result.data}
                        metric={insightSelection?.metric ?? 'words'}
                        pageRef={insightRef}
                        pageUrl={statisticsInsightUrl(
                            insightSelection?.metric ?? 'words',
                            params,
                        )}
                        onClose={closeInsights}
                        onRefresh={result.refresh}
                        loading={result.loading}
                        error={result.error}
                    />
                )}
            </div>
        </div>
    );
}
