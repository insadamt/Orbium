import { Link } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronRight,
    Database,
    Folder,
    Search,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { TreeNode } from '@/components/navigation/navigation-types';
import { nodeUrl } from '@/components/navigation/navigation-types';

type Props = {
    workspaceId: number;
    workspaceName: string;
    nodes: TreeNode[];
    currentNodeId: number | null;
};

function ancestorIds(nodes: TreeNode[], currentNodeId: number | null) {
    const ids = new Set<number>();
    let current = nodes.find((node) => node.id === currentNodeId);
    while (current?.parent_id !== null && current?.parent_id !== undefined) {
        ids.add(current.parent_id);
        current = nodes.find((node) => node.id === current?.parent_id);
    }
    return ids;
}

export default function WorkspaceSidebar({
    workspaceId,
    workspaceName,
    nodes,
    currentNodeId,
}: Props) {
    const [filter, setFilter] = useState('');
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
    const visibleNodes = nodes.filter((node) => node.type !== 'document');

    useEffect(() => {
        setExpandedIds((previous) => {
            const next = new Set(previous);
            ancestorIds(nodes, currentNodeId).forEach((id) => next.add(id));
            return next;
        });
    }, [nodes, currentNodeId]);

    function matchesFilter(node: TreeNode): boolean {
        if (!filter.trim()) return true;
        if (node.title.toLowerCase().includes(filter.toLowerCase()))
            return true;
        return visibleNodes.some(
            (child) => child.parent_id === node.id && matchesFilter(child),
        );
    }

    function renderBranch(
        parentId: number | null,
        depth: number,
    ): React.ReactNode {
        return visibleNodes
            .filter(
                (node) => node.parent_id === parentId && matchesFilter(node),
            )
            .map((node) => {
                const children = visibleNodes.filter(
                    (child) => child.parent_id === node.id,
                );
                const expanded = filter.trim()
                    ? true
                    : expandedIds.has(node.id);
                const Icon = node.type === 'database' ? Database : Folder;
                return (
                    <div key={node.id}>
                        <div
                            className={`group flex min-w-0 items-center rounded-lg pr-2 ${currentNodeId === node.id ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'}`}
                            style={{ paddingLeft: `${8 + depth * 16}px` }}
                        >
                            {node.type === 'folder' && children.length > 0 ? (
                                <button
                                    type="button"
                                    aria-label={`${expanded ? 'Collapse' : 'Expand'} ${node.title}`}
                                    aria-expanded={expanded}
                                    onClick={() =>
                                        setExpandedIds((previous) => {
                                            const next = new Set(previous);
                                            if (expanded) next.delete(node.id);
                                            else next.add(node.id);
                                            return next;
                                        })
                                    }
                                    className="flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-background/70 focus-visible:outline-2 focus-visible:outline-ring"
                                >
                                    {expanded ? (
                                        <ChevronDown size={14} />
                                    ) : (
                                        <ChevronRight size={14} />
                                    )}
                                </button>
                            ) : (
                                <span className="size-8 shrink-0" />
                            )}
                            <Link
                                href={nodeUrl(workspaceId, node)}
                                aria-current={
                                    currentNodeId === node.id
                                        ? 'page'
                                        : undefined
                                }
                                className="flex min-w-0 flex-1 items-center gap-2 py-2 text-sm focus-visible:outline-2 focus-visible:outline-ring"
                            >
                                <Icon
                                    size={16}
                                    className="shrink-0"
                                    aria-hidden="true"
                                />
                                <span className="truncate">{node.title}</span>
                            </Link>
                            <span className="text-[11px] text-muted-foreground tabular-nums">
                                {nodes.filter(
                                    (child) => child.parent_id === node.id,
                                ).length || ''}
                            </span>
                        </div>
                        {node.type === 'folder' &&
                            expanded &&
                            renderBranch(node.id, depth + 1)}
                    </div>
                );
            });
    }

    return (
        <aside
            aria-label="Workspace folders"
            className="flex w-full flex-col border-r border-border bg-card/40 md:w-72 md:shrink-0"
        >
            <div className="border-b border-border px-4 py-4">
                <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                    Workspace
                </p>
                <Link
                    href={`/workspaces/${workspaceId}`}
                    className="mt-1 block truncate text-base font-semibold hover:text-muted-foreground"
                >
                    {workspaceName}
                </Link>
            </div>
            <label className="mx-3 mt-4 flex items-center gap-2 rounded-lg border border-border bg-background/70 px-3 py-2 text-muted-foreground focus-within:ring-2 focus-within:ring-ring">
                <Search size={16} aria-hidden="true" />
                <input
                    type="search"
                    value={filter}
                    onChange={(event) => setFilter(event.target.value)}
                    placeholder="Filter folders"
                    aria-label="Filter folders"
                    className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
            </label>
            <div className="px-3 pt-5 pb-2 text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                Folders and databases
            </div>
            <nav
                aria-label="Folder tree"
                className="min-h-0 flex-1 overflow-y-auto px-2 pb-5"
            >
                <Link
                    href={`/workspaces/${workspaceId}`}
                    aria-current={currentNodeId === null ? 'page' : undefined}
                    className={`mb-1 flex items-center gap-2 rounded-lg px-4 py-2 text-sm ${currentNodeId === null ? 'bg-accent font-medium' : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'}`}
                >
                    <Folder size={16} aria-hidden="true" /> All items
                </Link>
                {renderBranch(null, 0)}
                {visibleNodes.length > 0 &&
                    !visibleNodes.some(
                        (node) =>
                            node.parent_id === null && matchesFilter(node),
                    ) && (
                        <p className="px-4 py-4 text-sm text-muted-foreground">
                            No matching folders.
                        </p>
                    )}
            </nav>
            <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
                Search everywhere with Ctrl + Space
            </p>
        </aside>
    );
}
