import { Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Database,
    FileText,
    Folder,
    MoreHorizontal,
    Plus,
    RotateCcw,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { CreateNodeForm } from '@/components/navigation/create-node-form';
import { NodeActions } from '@/components/navigation/node-actions';
import { nodeUrl } from '@/components/navigation/navigation-types';
import type { TreeNode } from '@/components/navigation/navigation-types';
import { openLocation } from '@/components/navigation/tab-navigation';

export type HierarchyNode = TreeNode;
export type TrashedNode = Pick<
    HierarchyNode,
    'id' | 'parent_id' | 'type' | 'title'
> & { deleted_at: string };

type Props = {
    workspaceId: number;
    workspaceName: string;
    nodes: HierarchyNode[];
    trashedNodes: TrashedNode[];
    currentNode: HierarchyNode | null;
};
const nodeIcons = { folder: Folder, document: FileText, database: Database };

export default function NodeBrowser({
    workspaceId,
    workspaceName,
    nodes,
    trashedNodes,
    currentNode,
}: Props) {
    const [createType, setCreateType] = useState<HierarchyNode['type'] | null>(
        null,
    );
    const [createMenuOpen, setCreateMenuOpen] = useState(false);
    const [actionsId, setActionsId] = useState<number | null>(null);
    const [showTrash, setShowTrash] = useState(false);
    const [localTags, setLocalTags] = useState<Record<number, string[]>>({});
    const parentId =
        currentNode?.type === 'document'
            ? currentNode.parent_id
            : (currentNode?.id ?? null);
    const children = nodes.filter(
        (node) =>
            node.parent_id === currentNode?.id ||
            (currentNode === null && node.parent_id === null),
    );
    const allowedTypes: HierarchyNode['type'][] =
        currentNode?.type === 'database'
            ? ['document']
            : ['document', 'folder', 'database'];
    const selectedNode = nodes.find((node) => node.id === actionsId);
    const parentUrl = currentNode?.parent_id
        ? `/workspaces/${workspaceId}/nodes/${currentNode.parent_id}`
        : `/workspaces/${workspaceId}`;

    function move(
        nodeId: number,
        nextParentId: number | null,
        position: number,
    ) {
        router.patch(
            `/workspaces/${workspaceId}/nodes/${nodeId}/move`,
            { parent_id: nextParentId, position },
            {
                preserveScroll: true,
                onError: (errors) => toast.error(Object.values(errors)[0]),
            },
        );
    }
    return (
        <section className="mx-auto max-w-[980px] min-w-0 flex-1">
            {currentNode && (
                <Link
                    href={parentUrl}
                    className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft size={16} /> Back to{' '}
                    {nodes.find((node) => node.id === currentNode.parent_id)
                        ?.title ?? workspaceName}
                </Link>
            )}
            <div className="mx-auto max-w-[780px]">
                <div>
                    <div>
                        <p className="mb-2 text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
                            {workspaceName}
                        </p>
                        <h1 className="text-4xl font-semibold tracking-tight break-words md:text-5xl">
                            {currentNode?.title ?? workspaceName}
                        </h1>
                        <p className="mt-3 text-sm text-muted-foreground">
                            {currentNode
                                ? currentNode.type === 'folder'
                                    ? 'Folder'
                                    : currentNode.type === 'database'
                                      ? 'Database'
                                      : 'Document'
                                : 'Workspace'}{' '}
                            · {children.length}{' '}
                            {children.length === 1 ? 'item' : 'items'}
                        </p>
                    </div>
                    <div className="mt-9 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setShowTrash((value) => !value)}
                                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                            >
                                <Trash2 size={15} /> Trash
                                {trashedNodes.length > 0
                                    ? ` (${trashedNodes.length})`
                                    : ''}
                            </button>
                            <div className="relative">
                                <button
                                    type="button"
                                    aria-label="Create an item"
                                    aria-expanded={createMenuOpen}
                                    onClick={() =>
                                        setCreateMenuOpen((value) => !value)
                                    }
                                    className="inline-flex items-center gap-2 rounded-lg bg-foreground px-3.5 py-2 text-sm font-medium text-background"
                                >
                                    <Plus size={16} /> New
                                </button>
                                {createMenuOpen && (
                                    <div className="absolute right-0 z-10 mt-1 w-44 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-xl">
                                        {allowedTypes.map((type) => (
                                            <button
                                                type="button"
                                                key={type}
                                                onClick={() => {
                                                    setCreateType(type);
                                                    setCreateMenuOpen(false);
                                                }}
                                                className="block w-full rounded-lg px-3 py-2 text-left text-sm capitalize hover:bg-accent"
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                {createType && (
                    <div className="mt-4">
                        <CreateNodeForm
                            workspaceId={workspaceId}
                            parentId={parentId}
                            type={createType}
                            onCancel={() => setCreateType(null)}
                            onCreated={() => setCreateType(null)}
                        />
                    </div>
                )}
                {children.length === 0 ? (
                    <div className="py-20 text-center">
                        <p className="text-lg font-medium">Nothing here yet</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Create a document, folder or database to get
                            started.
                        </p>
                        <div className="mt-5 flex justify-center gap-2">
                            {allowedTypes.map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setCreateType(type)}
                                    className="rounded-lg border border-border px-3 py-2 text-sm capitalize hover:bg-accent"
                                >
                                    New {type}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="divide-y divide-border/70">
                        {children.map((node) => {
                            const Icon = nodeIcons[node.type];
                            return (
                                <div
                                    key={node.id}
                                    className="group flex min-w-0 items-center gap-3 rounded-lg px-2 py-3 hover:bg-accent/50"
                                >
                                    <Icon
                                        size={19}
                                        className="shrink-0 text-muted-foreground"
                                        aria-hidden="true"
                                    />
                                    <Link
                                        href={nodeUrl(workspaceId, node)}
                                        className="min-w-0 flex-1 truncate text-sm font-medium focus-visible:underline"
                                    >
                                        {node.title}
                                    </Link>
                                    <span className="hidden text-xs text-muted-foreground sm:block">
                                        {node.type}
                                    </span>
                                    <button
                                        type="button"
                                        aria-label={`Actions for ${node.title}`}
                                        onClick={() =>
                                            setActionsId(
                                                actionsId === node.id
                                                    ? null
                                                    : node.id,
                                            )
                                        }
                                        className="rounded-md p-2 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-background hover:text-foreground focus:opacity-100"
                                    >
                                        <MoreHorizontal size={17} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
                {selectedNode && (
                    <div className="mt-4 overflow-hidden rounded-xl border border-border">
                        <NodeActions
                            workspaceId={workspaceId}
                            node={{
                                ...selectedNode,
                                tags:
                                    localTags[selectedNode.id] ??
                                    selectedNode.tags,
                            }}
                            nodes={nodes}
                            onClose={() => setActionsId(null)}
                            onDismiss={() => setActionsId(null)}
                            onTagsSaved={(id, tags) =>
                                setLocalTags((previous) => ({
                                    ...previous,
                                    [id]: tags,
                                }))
                            }
                            onOpen={openLocation}
                            onMove={move}
                        />
                    </div>
                )}
                {showTrash && (
                    <section className="mt-10 border-t border-border pt-5">
                        <h2 className="text-sm font-medium">Trash</h2>
                        {trashedNodes.length === 0 ? (
                            <p className="mt-4 text-sm text-muted-foreground">
                                Trash is empty.
                            </p>
                        ) : (
                            <div className="mt-3 divide-y divide-border/70">
                                {trashedNodes.map((node) => (
                                    <div
                                        key={node.id}
                                        className="flex items-center justify-between gap-3 py-3 text-sm"
                                    >
                                        <span className="min-w-0 truncate">
                                            {node.title}{' '}
                                            <span className="text-xs text-muted-foreground">
                                                · {node.type}
                                            </span>
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                router.post(
                                                    `/workspaces/${workspaceId}/nodes/${node.id}/restore`,
                                                )
                                            }
                                            aria-label={`Restore ${node.title}`}
                                            className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                                        >
                                            <RotateCcw size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}
            </div>
        </section>
    );
}
