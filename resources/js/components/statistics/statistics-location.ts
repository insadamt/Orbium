import type { StatisticsInsight } from './statistics-insight-types';

export function parseStatisticsLocation(pageUrl: string) {
    const params = new URLSearchParams(pageUrl.split('?')[1]);
    params.delete('category');
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
    const dataUrl =
        selection === 'page'
            ? `/workspaces/${workspaceId}/nodes/${nodeId}/statistics`
            : selection.startsWith('workspace:')
              ? `/statistics/data?workspace_id=${selection.slice(10)}`
              : '/statistics/data';
    return { params, selection, hasPage, dataUrl };
}

export function statisticsInsightUrl(
    metric: StatisticsInsight,
    params: URLSearchParams,
) {
    const query = params.toString();
    return `/statistics/insights/${metric}${query ? `?${query}` : ''}`;
}
