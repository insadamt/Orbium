// Keeps container filters persistent while allowing an explicit Reveal request to
// show its target temporarily; depends on navigation preferences and page search.
import { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import type { TreeNode } from '@/components/navigation/navigation-types';
import { useContainerView } from '@/components/navigation/use-container-view';
import { usePageSearch } from '@/components/navigation/page-search';

export const explorerSortOptions = [
    { value: 'manual', label: 'Manual order' },
    { value: 'name-ascending', label: 'Name A–Z' },
    { value: 'name-descending', label: 'Name Z–A' },
    { value: 'type', label: 'Type' },
];

export const explorerTypeOptions = [
    { value: 'all', label: 'All types' },
    { value: 'folder', label: 'Folders' },
    { value: 'document', label: 'Documents' },
    { value: 'database', label: 'Databases' },
    { value: 'board', label: 'Boards' },
    { value: 'favorites', label: 'Favorites' },
];

const titleCollator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: 'base',
});
const typeOrder = { folder: 0, database: 1, document: 2, board: 3 };

function compareNodes(first: TreeNode, second: TreeNode, sort: string) {
    const manualOrder =
        first.position - second.position || first.id - second.id;
    const titleOrder = titleCollator.compare(first.title, second.title);
    if (sort === 'name-ascending') return titleOrder || manualOrder;
    if (sort === 'name-descending') return -titleOrder || manualOrder;
    if (sort === 'type')
        return (
            typeOrder[first.type] - typeOrder[second.type] ||
            titleOrder ||
            manualOrder
        );
    return manualOrder;
}

export function useExplorerFilters({
    workspaceId,
    parentId,
    nodes,
}: {
    workspaceId: number;
    parentId: number | null;
    nodes: TreeNode[];
}) {
    const { url: revealRequestKey } = usePage();
    const focusId = Number(
        new URL(revealRequestKey, window.location.origin).searchParams.get(
            'focus',
        ),
    );
    const settingsKey = `explorer.${workspaceId}.${parentId ?? 'root'}`;
    const [savedSort, setSort] = useContainerView<string>(
        `${settingsKey}.sort`,
        'manual',
    );
    const [savedType, setTypeFilter] = useContainerView<string>(
        `${settingsKey}.type`,
        'all',
    );
    const sort = explorerSortOptions.some(
        (option) => option.value === savedSort,
    )
        ? savedSort
        : 'manual';
    const typeFilter = explorerTypeOptions.some(
        (option) => option.value === savedType,
    )
        ? savedType
        : 'all';
    const search = usePageSearch();
    const normalizedQuery = search.query.trim().toLocaleLowerCase();
    const [revealRequest, setRevealRequest] = useState({
        key: revealRequestKey,
        query: search.query,
        typeFilter,
        dismissed: false,
    });
    const isNewRevealRequest = revealRequest.key !== revealRequestKey;
    const filtersChanged =
        (revealRequest.query !== search.query && normalizedQuery !== '') ||
        revealRequest.typeFilter !== typeFilter;

    // A reveal must not overwrite saved filters or keep overriding later searches.
    if (isNewRevealRequest) {
        setRevealRequest({
            key: revealRequestKey,
            query: search.query,
            typeFilter,
            dismissed: false,
        });
    } else if (filtersChanged && !revealRequest.dismissed) {
        setRevealRequest({ ...revealRequest, dismissed: true });
    }
    const revealActive =
        isNewRevealRequest || (!revealRequest.dismissed && !filtersChanged);
    const directChildren = nodes
        .filter((node) => node.parent_id === parentId)
        .sort((first, second) => compareNodes(first, second, 'manual'));
    const matchingChildren = directChildren.filter(
        (node) =>
            (typeFilter === 'all' ||
                (typeFilter === 'favorites'
                    ? node.is_favorite
                    : node.type === typeFilter)) &&
            (!normalizedQuery ||
                node.title.toLocaleLowerCase().includes(normalizedQuery)),
    );
    const revealTarget = directChildren.find((node) => node.id === focusId);
    const revealedOutsideFilters = Boolean(
        revealActive &&
        revealTarget &&
        !matchingChildren.some((node) => node.id === focusId),
    );
    const children = [
        ...matchingChildren,
        ...(revealedOutsideFilters && revealTarget ? [revealTarget] : []),
    ].sort((first, second) => compareNodes(first, second, sort));
    useEffect(() => {
        search.setResultCount(normalizedQuery ? matchingChildren.length : null);
    }, [matchingChildren.length, normalizedQuery, search.setResultCount]);
    return {
        focusId,
        revealRequestKey,
        children,
        directChildren,
        sort,
        setSort,
        typeFilter,
        setTypeFilter,
        hasActiveFilter: Boolean(normalizedQuery) || typeFilter !== 'all',
        revealedOutsideFilters,
        dismissReveal: () =>
            setRevealRequest((request) => ({ ...request, dismissed: true })),
        clearFilters: () => {
            search.setQuery('');
            setTypeFilter('all');
        },
    };
}
