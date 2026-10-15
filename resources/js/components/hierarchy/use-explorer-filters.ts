import { useEffect } from 'react';
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
];

const titleCollator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: 'base',
});
const typeOrder = { folder: 0, database: 1, document: 2 };

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
    const directChildren = nodes
        .filter((node) => node.parent_id === parentId)
        .sort((first, second) => compareNodes(first, second, 'manual'));
    const children = directChildren
        .filter(
            (node) =>
                (typeFilter === 'all' || node.type === typeFilter) &&
                (!normalizedQuery ||
                    node.title.toLocaleLowerCase().includes(normalizedQuery)),
        )
        .sort((first, second) => compareNodes(first, second, sort));
    useEffect(() => {
        search.setResultCount(normalizedQuery ? children.length : null);
    }, [children.length, normalizedQuery, search.setResultCount]);
    return {
        children,
        directChildren,
        sort,
        setSort,
        typeFilter,
        setTypeFilter,
        hasActiveFilter: Boolean(normalizedQuery) || typeFilter !== 'all',
    };
}
