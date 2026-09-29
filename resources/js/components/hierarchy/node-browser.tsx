import { Link, router } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowUp,
    Database,
    FileText,
    Folder,
    RotateCcw,
    Trash2,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';

export type HierarchyNode = {
    id: number;
    parent_id: number | null;
    type: 'folder' | 'document' | 'database';
    title: string;
    position: number;
};

export type TrashedNode = Pick<
    HierarchyNode,
    'id' | 'parent_id' | 'type' | 'title'
> & {
    deleted_at: string;
};

type NodeBrowserProps = {
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
}: NodeBrowserProps) {
    const [title, setTitle] = useState('');
    const [type, setType] = useState<HierarchyNode['type']>('document');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editedTitle, setEditedTitle] = useState('');
    const [movingId, setMovingId] = useState<number | null>(null);
    const [targetParentId, setTargetParentId] = useState<string>('root');
    const [showTrash, setShowTrash] = useState(false);
    const creationParentId =
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

    function createNode(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        router.post(
            `/workspaces/${workspaceId}/nodes`,
            {
                title: title.trim(),
                type: allowedTypes.includes(type) ? type : 'document',
                parent_id: creationParentId,
            },
            { onSuccess: () => setTitle('') },
        );
    }

    function renameNode(event: FormEvent<HTMLFormElement>, id: number): void {
        event.preventDefault();
        router.patch(
            `/workspaces/${workspaceId}/nodes/${id}`,
            { title: editedTitle.trim() },
            {
                onSuccess: () => setEditingId(null),
            },
        );
    }

    function moveNode(
        event: FormEvent<HTMLFormElement>,
        node: HierarchyNode,
    ): void {
        event.preventDefault();
        const parentId =
            targetParentId === 'root' ? null : Number(targetParentId);
        const position = nodes.filter(
            (item) => item.parent_id === parentId && item.id !== node.id,
        ).length;
        router.patch(
            `/workspaces/${workspaceId}/nodes/${node.id}/move`,
            {
                parent_id: parentId,
                position,
            },
            { onSuccess: () => setMovingId(null) },
        );
    }

    function reorderNode(node: HierarchyNode, position: number): void {
        router.patch(`/workspaces/${workspaceId}/nodes/${node.id}/move`, {
            parent_id: node.parent_id,
            position,
        });
    }

    function trashNode(node: HierarchyNode): void {
        if (
            window.confirm(`Move “${node.title}” and its descendants to Trash?`)
        ) {
            router.delete(`/workspaces/${workspaceId}/nodes/${node.id}`);
        }
    }

    return (
        <section className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                        {workspaceName}
                    </p>
                    <h1 className="mt-2 text-4xl font-light tracking-tight break-words">
                        {currentNode?.title ?? 'Workspace root'}
                    </h1>
                    {currentNode && (
                        <p className="mt-2 text-sm text-muted-foreground capitalize">
                            {currentNode.type}
                            {currentNode.type === 'document'
                                ? ' · Editor arrives in Phase 2'
                                : currentNode.type === 'database'
                                  ? ' · Views arrive in Phase 3'
                                  : ''}
                        </p>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => setShowTrash(!showTrash)}
                    className="rounded-full border border-border px-4 py-2 text-sm hover:bg-accent"
                >
                    {showTrash
                        ? 'Hide Trash'
                        : `Trash (${trashedNodes.length})`}
                </button>
            </div>

            <form
                onSubmit={createNode}
                className="glass-surface mt-8 flex flex-wrap gap-2 rounded-2xl border border-border p-4"
            >
                <select
                    aria-label="New node type"
                    value={allowedTypes.includes(type) ? type : 'document'}
                    onChange={(event) =>
                        setType(event.target.value as HierarchyNode['type'])
                    }
                    className="rounded-lg border bg-background px-3 py-2 text-sm"
                >
                    {allowedTypes.map((option) => (
                        <option key={option} value={option}>
                            {option[0].toUpperCase() + option.slice(1)}
                        </option>
                    ))}
                </select>
                <input
                    aria-label="New node title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    maxLength={255}
                    placeholder="Name your item"
                    className="min-w-40 flex-1 rounded-lg border bg-background px-3 py-2 text-sm"
                />
                <button
                    type="submit"
                    disabled={!title.trim()}
                    className="rounded-lg bg-foreground px-5 py-2 text-sm font-medium text-background disabled:opacity-40"
                >
                    Create
                </button>
            </form>

            <div className="mt-8 space-y-3">
                {children.length === 0 && (
                    <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                        Nothing here yet. Create an item above.
                    </p>
                )}
                {children.map((node, index) => {
                    const Icon = nodeIcons[node.type];
                    return (
                        <article
                            key={node.id}
                            className="rounded-2xl border border-border bg-card/70 p-4"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                {editingId === node.id ? (
                                    <form
                                        onSubmit={(event) =>
                                            renameNode(event, node.id)
                                        }
                                        className="flex min-w-0 flex-1 gap-2"
                                    >
                                        <input
                                            aria-label="Node title"
                                            value={editedTitle}
                                            onChange={(event) =>
                                                setEditedTitle(
                                                    event.target.value,
                                                )
                                            }
                                            maxLength={255}
                                            className="min-w-0 flex-1 rounded-md border bg-background px-3 py-1"
                                        />
                                        <button
                                            type="submit"
                                            className="text-sm font-medium"
                                        >
                                            Save
                                        </button>
                                    </form>
                                ) : (
                                    <Link
                                        href={`/workspaces/${workspaceId}/nodes/${node.id}`}
                                        className="flex min-w-0 items-center gap-3 hover:underline"
                                    >
                                        <Icon
                                            size={20}
                                            className="shrink-0 text-muted-foreground"
                                        />
                                        <span className="truncate font-medium">
                                            {node.title}
                                        </span>
                                        <span className="text-xs text-muted-foreground capitalize">
                                            {node.type}
                                        </span>
                                    </Link>
                                )}
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingId(node.id);
                                            setEditedTitle(node.title);
                                        }}
                                        className="rounded px-2 py-1 hover:bg-accent"
                                    >
                                        Rename
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMovingId(
                                                movingId === node.id
                                                    ? null
                                                    : node.id,
                                            );
                                            setTargetParentId(
                                                node.parent_id === null
                                                    ? 'root'
                                                    : String(node.parent_id),
                                            );
                                        }}
                                        className="rounded px-2 py-1 hover:bg-accent"
                                    >
                                        Move
                                    </button>
                                    <button
                                        type="button"
                                        disabled={index === 0}
                                        onClick={() =>
                                            reorderNode(node, index - 1)
                                        }
                                        aria-label={`Move ${node.title} up`}
                                        className="rounded p-1 hover:bg-accent disabled:opacity-30"
                                    >
                                        <ArrowUp size={16} />
                                    </button>
                                    <button
                                        type="button"
                                        disabled={index === children.length - 1}
                                        onClick={() =>
                                            reorderNode(node, index + 1)
                                        }
                                        aria-label={`Move ${node.title} down`}
                                        className="rounded p-1 hover:bg-accent disabled:opacity-30"
                                    >
                                        <ArrowDown size={16} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => trashNode(node)}
                                        aria-label={`Trash ${node.title}`}
                                        className="rounded p-1 text-destructive hover:bg-accent"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            {movingId === node.id && (
                                <form
                                    onSubmit={(event) => moveNode(event, node)}
                                    className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4"
                                >
                                    <select
                                        aria-label={`Move ${node.title} to`}
                                        value={targetParentId}
                                        onChange={(event) =>
                                            setTargetParentId(
                                                event.target.value,
                                            )
                                        }
                                        className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 text-sm"
                                    >
                                        <option value="root">
                                            Workspace root
                                        </option>
                                        {nodes
                                            .filter(
                                                (candidate) =>
                                                    candidate.type ===
                                                        'folder' ||
                                                    (candidate.type ===
                                                        'database' &&
                                                        node.type ===
                                                            'document'),
                                            )
                                            .map((candidate) => (
                                                <option
                                                    key={candidate.id}
                                                    value={candidate.id}
                                                >
                                                    {candidate.title} ·{' '}
                                                    {candidate.type}
                                                </option>
                                            ))}
                                    </select>
                                    <button
                                        type="submit"
                                        className="rounded-lg bg-foreground px-4 py-2 text-sm text-background"
                                    >
                                        Move
                                    </button>
                                </form>
                            )}
                        </article>
                    );
                })}
            </div>

            {showTrash && (
                <section className="mt-10 border-t border-border pt-6">
                    <h2 className="text-lg font-medium">Trash</h2>
                    {trashedNodes.length === 0 && (
                        <p className="mt-3 text-sm text-muted-foreground">
                            No trashed items.
                        </p>
                    )}
                    <div className="mt-4 space-y-2">
                        {trashedNodes.map((node) => (
                            <div
                                key={node.id}
                                className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm"
                            >
                                <span className="truncate">
                                    {node.title}{' '}
                                    <span className="text-muted-foreground capitalize">
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
                                    className="rounded p-1 hover:bg-accent"
                                >
                                    <RotateCcw size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </section>
    );
}
