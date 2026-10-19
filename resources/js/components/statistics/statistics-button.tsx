import { usePage } from '@inertiajs/react';
import { ChartNoAxesColumn } from 'lucide-react';
import { useNavigation } from '@/components/navigation/navigation-store';
import { useTabPageCache } from '@/components/navigation/tab-page-cache';
import type { StatisticsTarget } from './statistics-types';
import { openLocation } from '@/components/navigation/tab-navigation';

type PageContext = {
    [key: string]: unknown;
    workspace?: { id: number; name: string };
    node?: { id: number; title: string };
    database?: { id: number; title: string };
    currentNode?: { id: number; title: string; type?: string } | null;
};

function statisticsTarget(context: PageContext): StatisticsTarget {
    // Board content statistics depend on spatial content; use workspace statistics for now.

    const node =
        context.node ??
        context.database ??
        (context.currentNode?.type === 'board' ? null : context.currentNode);
    return {
        workspaceId: context.workspace?.id ?? null,
        nodeId: node?.id ?? null,
        title: node?.title ?? context.workspace?.name ?? 'Account',
    };
}

export function StatisticsButton({ className }: { className: string }) {
    const page = usePage<PageContext>();
    const activeId = useNavigation((state) => state.activeId);
    const activeUrl = useNavigation((state) => {
        const tab = state.tabs.find(
            (candidate) => candidate.id === state.activeId,
        );
        return tab?.entries[tab.index].url;
    });
    const cachedPage = useTabPageCache((state) => state.pages[activeId]?.page);
    const visiblePage =
        window.self === window.top && cachedPage && cachedPage.url === activeUrl
            ? cachedPage
            : page;

    return (
        <button
            type="button"
            onClick={() => {
                const target = statisticsTarget(visiblePage.props);
                const params = new URLSearchParams();
                if (target.workspaceId !== null)
                    params.set('workspace_id', String(target.workspaceId));
                if (target.nodeId !== null) {
                    params.set('node_id', String(target.nodeId));
                    params.set('scope', 'page');
                    params.set('title', target.title);
                }
                if (/^\/workspaces\/\d+(?:[/?]|$)/.test(visiblePage.url))
                    params.set('return', visiblePage.url);
                openLocation(
                    `/statistics${params.size ? `?${params}` : ''}`,
                    true,
                );
            }}
            className={className}
            aria-label="Statistics"
            title="Statistics"
        >
            <ChartNoAxesColumn size={18} />
        </button>
    );
}
