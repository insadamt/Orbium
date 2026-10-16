import '../../../css/statistics.css';
import { Head, usePage } from '@inertiajs/react';
import { ArrowLeft, ChartNoAxesColumn } from 'lucide-react';
import { AppSelect } from '@/components/ui/app-select';
import { StatisticsPanel } from '@/components/statistics/statistics-panel';
import {
    activateTab,
    openLocation,
} from '@/components/navigation/tab-navigation';
import { useNavigation } from '@/components/navigation/navigation-store';

export default function StatisticsPage() {
    const page = usePage<{
        statisticsWorkspaces: { id: number; name: string }[];
    }>();
    const params = new URLSearchParams(page.url.split('?')[1]);
    const workspaceId = params.get('workspace_id');
    const nodeId = params.get('node_id');
    const hasPage =
        /^\d+$/.test(workspaceId ?? '') && /^\d+$/.test(nodeId ?? '');
    const selectedWorkspace = params.get('selected_workspace');
    const selection =
        hasPage && params.get('scope') === 'page'
            ? 'page'
            : params.get('scope') === 'account' ||
                !(selectedWorkspace ?? workspaceId)
              ? 'account'
              : `workspace:${selectedWorkspace ?? workspaceId}`;
    const url =
        selection === 'page'
            ? `/workspaces/${workspaceId}/nodes/${nodeId}/statistics`
            : selection.startsWith('workspace:')
              ? `/statistics/data?workspace_id=${selection.slice(10)}`
              : '/statistics/data';
    const returnUrl = params.get('return');
    const canReturn =
        returnUrl && /^\/workspaces\/\d+(?:[/?]|$)/.test(returnUrl);

    function changeScope(value: string) {
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
        <div className="floating-body-island mx-auto w-full max-w-4xl space-y-8">
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
                        <span className="rounded-2xl bg-accent p-3">
                            <ChartNoAxesColumn size={24} aria-hidden="true" />
                        </span>
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight">
                                Statistics
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Understand your writing, content, tasks, and
                                storage.
                            </p>
                        </div>
                    </div>
                    <div className="w-full space-y-2 sm:w-auto">
                        <p className="text-xs font-medium text-muted-foreground">
                            View statistics for
                        </p>
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
                                { value: 'account', label: 'All workspaces' },
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
            <StatisticsPanel key={url} url={url} />
        </div>
    );
}
