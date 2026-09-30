import { Link } from '@inertiajs/react';
import { Database, FileText, Folder, MoreHorizontal } from 'lucide-react';
import { useState, type DragEvent } from 'react';
import {
    nodeUrl,
    type TreeNode,
} from '@/components/navigation/navigation-types';

type DropPlacement = 'before' | 'inside' | 'after';
type DropHint = { targetId: number; placement: DropPlacement };

type Props = {
    nodes: TreeNode[];
    allNodes: TreeNode[];
    workspaceId: number;
    onActions: (nodeId: number) => void;
    onMove: (nodeId: number, parentId: number | null, position: number) => void;
};

const nodeIcons = { folder: Folder, document: FileText, database: Database };

function containsNode(nodes: TreeNode[], parentId: number, childId: number) {
    let current = nodes.find((node) => node.id === parentId);
    while (current) {
        if (current.id === childId) return true;
        current = nodes.find((node) => node.id === current?.parent_id);
    }
    return false;
}

function dropPlacement(
    event: DragEvent<HTMLElement>,
    target: TreeNode,
): DropPlacement {
    const bounds = event.currentTarget.getBoundingClientRect();
    const position =
        target.type === 'folder'
            ? (event.clientX - bounds.left) / bounds.width
            : (event.clientY - bounds.top) / bounds.height;
    if (position < 0.25) return 'before';
    if (position > 0.75) return 'after';
    return target.type === 'folder' ? 'inside' : 'after';
}

function canDrop(
    nodes: TreeNode[],
    source: TreeNode,
    target: TreeNode,
    placement: DropPlacement,
) {
    if (source.id === target.id) return false;
    if (placement !== 'inside') return true;
    if (target.type !== 'folder') return false;
    return !containsNode(nodes, target.id, source.id);
}

function destinationPosition(
    source: TreeNode,
    target: TreeNode,
    placement: Exclude<DropPlacement, 'inside'>,
) {
    const sourcePrecedesTarget =
        source.parent_id === target.parent_id &&
        source.position < target.position;
    return (
        target.position +
        (placement === 'after' ? 1 : 0) -
        (sourcePrecedesTarget ? 1 : 0)
    );
}

export default function FileExplorer({
    nodes,
    allNodes,
    workspaceId,
    onActions,
    onMove,
}: Props) {
    const [draggedId, setDraggedId] = useState<number | null>(null);
    const [dropHint, setDropHint] = useState<DropHint | null>(null);
    const folders = nodes.filter((node) => node.type === 'folder');
    const files = nodes.filter((node) => node.type !== 'folder');

    function beginDrag(event: DragEvent<HTMLElement>, nodeId: number) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('application/orbium-node', String(nodeId));
        setDraggedId(nodeId);
    }

    function inspectDrop(event: DragEvent<HTMLElement>, target: TreeNode) {
        const source = allNodes.find((node) => node.id === draggedId);
        if (!source) return;
        const placement = dropPlacement(event, target);
        if (!canDrop(allNodes, source, target, placement)) {
            setDropHint(null);
            return;
        }
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        setDropHint((previous) =>
            previous?.targetId === target.id && previous.placement === placement
                ? previous
                : { targetId: target.id, placement },
        );
    }

    function finishDrop(event: DragEvent<HTMLElement>, target: TreeNode) {
        event.preventDefault();
        event.stopPropagation();
        const sourceId = Number(
            event.dataTransfer.getData('application/orbium-node'),
        );
        const source = allNodes.find((node) => node.id === sourceId);
        const placement = dropPlacement(event, target);
        setDraggedId(null);
        setDropHint(null);
        if (!source || !canDrop(allNodes, source, target, placement)) return;
        if (placement === 'inside') {
            const childCount = allNodes.filter(
                (node) => node.parent_id === target.id && node.id !== source.id,
            ).length;
            onMove(source.id, target.id, childCount);
            return;
        }
        onMove(
            source.id,
            target.parent_id,
            destinationPosition(source, target, placement),
        );
    }

    function dragHandlers(node: TreeNode) {
        return {
            draggable: true,
            onDragStart: (event: DragEvent<HTMLElement>) =>
                beginDrag(event, node.id),
            onDragEnd: () => {
                setDraggedId(null);
                setDropHint(null);
            },
            onDragOver: (event: DragEvent<HTMLElement>) =>
                inspectDrop(event, node),
            onDragLeave: (event: DragEvent<HTMLElement>) => {
                if (
                    event.relatedTarget instanceof Node &&
                    event.currentTarget.contains(event.relatedTarget)
                )
                    return;
                setDropHint(null);
            },
            onDrop: (event: DragEvent<HTMLElement>) => finishDrop(event, node),
            onContextMenu: (event: React.MouseEvent<HTMLElement>) => {
                event.preventDefault();
                onActions(node.id);
            },
        };
    }

    return (
        <div className="space-y-9 py-6">
            {folders.length > 0 && (
                <section aria-labelledby="folders-heading">
                    <h2
                        id="folders-heading"
                        className="mb-4 text-lg font-semibold"
                    >
                        Folders{' '}
                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                            {folders.length}
                        </span>
                    </h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {folders.map((node) => {
                            const hint =
                                dropHint?.targetId === node.id
                                    ? dropHint.placement
                                    : null;
                            const count = allNodes.filter(
                                (child) => child.parent_id === node.id,
                            ).length;
                            return (
                                <div
                                    key={node.id}
                                    {...dragHandlers(node)}
                                    className={`group relative min-w-0 rounded-2xl border bg-card p-4 transition-colors ${hint === 'inside' ? 'border-ring bg-accent' : 'border-border hover:border-ring/60 hover:bg-accent/30'} ${draggedId === node.id ? 'opacity-50' : ''}`}
                                >
                                    {hint === 'before' && (
                                        <span className="absolute inset-y-4 -left-2 w-1 rounded-full bg-ring" />
                                    )}
                                    {hint === 'after' && (
                                        <span className="absolute inset-y-4 -right-2 w-1 rounded-full bg-ring" />
                                    )}
                                    <Link
                                        href={nodeUrl(workspaceId, node)}
                                        title={node.title}
                                        className="block min-w-0 focus-visible:rounded-lg focus-visible:outline-2 focus-visible:outline-ring"
                                    >
                                        <span className="mb-5 flex h-24 items-center justify-center rounded-xl border border-border/60 bg-muted/60 text-muted-foreground group-hover:text-foreground">
                                            <Folder
                                                size={54}
                                                strokeWidth={1.1}
                                                aria-hidden="true"
                                            />
                                        </span>
                                        <span className="block truncate text-sm font-medium">
                                            {node.title}
                                        </span>
                                        <span className="mt-1 block text-xs text-muted-foreground">
                                            {count}{' '}
                                            {count === 1 ? 'item' : 'items'}
                                        </span>
                                    </Link>
                                    <button
                                        type="button"
                                        aria-label={`Actions for ${node.title}`}
                                        onClick={() => onActions(node.id)}
                                        className="absolute top-5 right-5 flex size-8 items-center justify-center rounded-lg bg-background/80 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground focus:opacity-100"
                                    >
                                        <MoreHorizontal size={17} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}
            {files.length > 0 && (
                <section aria-labelledby="files-heading">
                    <h2
                        id="files-heading"
                        className="mb-4 text-lg font-semibold"
                    >
                        Documents and databases{' '}
                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                            {files.length}
                        </span>
                    </h2>
                    <div className="overflow-hidden rounded-xl border border-border bg-card/55">
                        <div className="grid grid-cols-[minmax(0,1fr)_7rem_2.5rem] border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground sm:grid-cols-[minmax(0,1fr)_10rem_2.5rem]">
                            <span>Name</span>
                            <span>Type</span>
                            <span className="sr-only">Actions</span>
                        </div>
                        {files.map((node) => {
                            const Icon = nodeIcons[node.type];
                            const hint =
                                dropHint?.targetId === node.id
                                    ? dropHint.placement
                                    : null;
                            return (
                                <div
                                    key={node.id}
                                    {...dragHandlers(node)}
                                    className={`group relative grid min-w-0 grid-cols-[minmax(0,1fr)_7rem_2.5rem] items-center border-b border-border/65 px-4 last:border-0 sm:grid-cols-[minmax(0,1fr)_10rem_2.5rem] ${hint ? 'bg-accent' : 'hover:bg-accent/45'} ${draggedId === node.id ? 'opacity-50' : ''}`}
                                >
                                    {hint === 'before' && (
                                        <span className="absolute inset-x-3 -top-0.5 h-1 rounded-full bg-ring" />
                                    )}
                                    {hint === 'after' && (
                                        <span className="absolute inset-x-3 -bottom-0.5 h-1 rounded-full bg-ring" />
                                    )}
                                    <Link
                                        href={nodeUrl(workspaceId, node)}
                                        title={node.title}
                                        className="flex min-w-0 items-center gap-3 py-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring"
                                    >
                                        <Icon
                                            size={18}
                                            className="shrink-0 text-muted-foreground"
                                            aria-hidden="true"
                                        />
                                        <span className="truncate">
                                            {node.title}
                                        </span>
                                    </Link>
                                    <span className="text-xs text-muted-foreground capitalize">
                                        {node.type}
                                    </span>
                                    <button
                                        type="button"
                                        aria-label={`Actions for ${node.title}`}
                                        onClick={() => onActions(node.id)}
                                        className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-background hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                                    >
                                        <MoreHorizontal size={17} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}
        </div>
    );
}
