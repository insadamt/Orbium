import { router } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronRight,
    Database,
    FileText,
    Folder,
    Home,
    MoreHorizontal,
    Search,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle } from './navigation-dialog';
import { NodeActions } from './node-actions';
import type { TreeNode } from './navigation-types';
import { nodeUrl } from './navigation-types';

type Props = {
    workspaceId: number;
    nodes: TreeNode[];
    open: boolean;
    revealId?: number;
    error: string;
    onClose: () => void;
    onOpen: (url: string, newTab?: boolean) => void;
};
const nodeIcons = { document: FileText, folder: Folder, database: Database };

export function Navigator({
    workspaceId,
    nodes,
    open,
    revealId,
    error,
    onClose,
    onOpen,
}: Props) {
    const [filter, setFilter] = useState('');
    const [expanded, setExpanded] = useState<number[]>([]);
    const [selected, setSelected] = useState<number | null>(null);
    const [actionsId, setActionsId] = useState<number | null>(null);
    const [localTags, setLocalTags] = useState<Record<number, string[]>>({});
    const treeRef = useRef<HTMLDivElement>(null);
    const filterRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!open) {
            setActionsId(null);
            return;
        }
        requestAnimationFrame(() => filterRef.current?.focus());
    }, [open]);
    useEffect(() => {
        if (!open || !revealId) return;
        const ancestors: number[] = [];
        let current = nodes.find((node) => node.id === revealId);
        while (current?.parent_id) {
            ancestors.push(current.parent_id);
            current = nodes.find((node) => node.id === current?.parent_id);
        }
        setExpanded((previous) => [...new Set([...previous, ...ancestors])]);
        setSelected(revealId);
        setFilter('');
        requestAnimationFrame(() =>
            treeRef.current
                ?.querySelector<HTMLElement>(`[data-node-id="${revealId}"]`)
                ?.scrollIntoView({ block: 'nearest' }),
        );
    }, [open, revealId, nodes]);

    const included = new Set<number>();
    for (const node of nodes) {
        if (!node.title.toLowerCase().includes(filter.toLowerCase())) continue;
        included.add(node.id);
        let parent = nodes.find((candidate) => candidate.id === node.parent_id);
        while (parent) {
            included.add(parent.id);
            parent = nodes.find(
                (candidate) => candidate.id === parent?.parent_id,
            );
        }
    }
    const rows: { node: TreeNode; depth: number }[] = [];
    function appendChildren(parentId: number | null, depth: number) {
        for (const node of nodes.filter(
            (candidate) => candidate.parent_id === parentId,
        )) {
            if (filter && !included.has(node.id)) continue;
            rows.push({ node, depth });
            if (filter || expanded.includes(node.id))
                appendChildren(node.id, depth + 1);
        }
    }
    appendChildren(null, 0);
    const selectedNode = nodes.find((node) => node.id === actionsId);

    function move(nodeId: number, parentId: number | null, position: number) {
        router.patch(
            `/workspaces/${workspaceId}/nodes/${nodeId}/move`,
            { parent_id: parentId, position },
            {
                preserveScroll: true,
                onError: (errors) => toast.error(Object.values(errors)[0]),
            },
        );
    }
    function toggle(id: number) {
        setExpanded((previous) =>
            previous.includes(id)
                ? previous.filter((value) => value !== id)
                : [...previous, id],
        );
    }
    function selectRow(id: number) {
        setSelected(id);
        treeRef.current
            ?.querySelector<HTMLElement>(`[data-node-id="${id}"]`)
            ?.scrollIntoView({ block: 'nearest' });
    }
    function openNode(node: TreeNode, newTab = false) {
        onOpen(nodeUrl(workspaceId, node), newTab);
        onClose();
    }
    function handleTreeKey(event: React.KeyboardEvent<HTMLDivElement>) {
        const index = rows.findIndex((row) => row.node.id === selected);
        const node = rows[index]?.node;
        if (
            [
                'ArrowDown',
                'ArrowUp',
                'ArrowLeft',
                'ArrowRight',
                'Enter',
            ].includes(event.key)
        )
            event.preventDefault();
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            const next =
                rows[
                    Math.max(
                        0,
                        Math.min(
                            rows.length - 1,
                            index + (event.key === 'ArrowDown' ? 1 : -1),
                        ),
                    )
                ];
            if (next) selectRow(next.node.id);
        }
        if (node && event.key === 'ArrowRight' && node.type !== 'document')
            setExpanded((previous) => [...new Set([...previous, node.id])]);
        if (node && event.key === 'ArrowLeft') {
            if (expanded.includes(node.id)) toggle(node.id);
            else setSelected(node.parent_id);
        }
        if (node && event.key === 'Enter')
            openNode(node, event.ctrlKey || event.metaKey);
        if (
            node &&
            (event.key === 'ContextMenu' ||
                (event.shiftKey && event.key === 'F10'))
        ) {
            event.preventDefault();
            setActionsId(node.id);
        }
    }
    function dropAtRoot(event: React.DragEvent) {
        event.preventDefault();
        const id = Number(
            event.dataTransfer.getData('application/orbium-node'),
        );
        if (id)
            move(
                id,
                null,
                nodes.filter((node) => node.parent_id === null).length,
            );
    }
    function dropOnNode(event: React.DragEvent, node: TreeNode) {
        event.preventDefault();
        event.stopPropagation();
        const id = Number(
            event.dataTransfer.getData('application/orbium-node'),
        );
        if (!id) return;
        if (event.shiftKey || node.type === 'document')
            move(id, node.parent_id, node.position);
        else
            move(
                id,
                node.id,
                nodes.filter((child) => child.parent_id === node.id).length,
            );
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(value) => {
                if (!value) onClose();
            }}
        >
            <DialogContent className="glass-surface !top-0 !left-0 h-dvh w-[min(420px,100vw)] !max-w-none !translate-x-0 !translate-y-0 gap-0 overflow-hidden rounded-none border-y-0 border-l-0 p-0 sm:rounded-r-2xl">
                <div className="border-b border-border/70 px-5 pt-6 pb-4">
                    <div className="mb-4 flex items-center justify-between pr-8">
                        <div>
                            <DialogTitle className="text-lg font-semibold tracking-tight">
                                Navigator
                            </DialogTitle>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Browse this workspace
                            </p>
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums">
                            {nodes.length} items
                        </span>
                    </div>
                    <label className="flex items-center gap-2 rounded-lg border border-border bg-background/70 px-3 py-2.5 focus-within:ring-2 focus-within:ring-ring">
                        <Search
                            size={16}
                            className="text-muted-foreground"
                            aria-hidden="true"
                        />
                        <input
                            ref={filterRef}
                            aria-label="Filter tree titles"
                            placeholder="Filter tree titles…"
                            value={filter}
                            onChange={(event) => setFilter(event.target.value)}
                            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                        />
                    </label>
                </div>
                {error && (
                    <p
                        role="alert"
                        className="mx-4 mt-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
                    >
                        {error}
                    </p>
                )}
                <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
                    <button
                        type="button"
                        onClick={() => {
                            onOpen(`/workspaces/${workspaceId}`);
                            onClose();
                        }}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={dropAtRoot}
                        className="mb-2 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <Home size={17} className="text-muted-foreground" />{' '}
                        Workspace root
                    </button>
                    <div
                        ref={treeRef}
                        role="tree"
                        aria-label="Workspace hierarchy"
                        tabIndex={0}
                        aria-activedescendant={
                            selected ? `tree-node-${selected}` : undefined
                        }
                        onKeyDown={handleTreeKey}
                        className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        {!rows.length && (
                            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                                {filter
                                    ? 'No matching titles.'
                                    : 'Nothing here yet.'}
                            </p>
                        )}
                        {rows.map(({ node, depth }) => {
                            const Icon = nodeIcons[node.type];
                            const isExpanded = expanded.includes(node.id);
                            return (
                                <div
                                    key={node.id}
                                    id={`tree-node-${node.id}`}
                                    data-node-id={node.id}
                                    role="treeitem"
                                    aria-level={depth + 1}
                                    aria-selected={selected === node.id}
                                    aria-expanded={
                                        node.type !== 'document'
                                            ? isExpanded
                                            : undefined
                                    }
                                    draggable
                                    onDragStart={(event) =>
                                        event.dataTransfer.setData(
                                            'application/orbium-node',
                                            String(node.id),
                                        )
                                    }
                                    onDragOver={(event) =>
                                        event.preventDefault()
                                    }
                                    onDrop={(event) => dropOnNode(event, node)}
                                    onContextMenu={(event) => {
                                        event.preventDefault();
                                        setSelected(node.id);
                                        setActionsId(node.id);
                                    }}
                                    className={`group flex min-w-0 items-center rounded-lg py-0.5 pr-1 ${selected === node.id || actionsId === node.id ? 'bg-accent' : 'hover:bg-accent/60'}`}
                                    style={{ paddingLeft: 4 + depth * 16 }}
                                >
                                    <button
                                        type="button"
                                        aria-label={`Toggle ${node.title}`}
                                        disabled={node.type === 'document'}
                                        onClick={() => toggle(node.id)}
                                        className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground disabled:opacity-0"
                                    >
                                        {isExpanded ? (
                                            <ChevronDown size={15} />
                                        ) : (
                                            <ChevronRight size={15} />
                                        )}
                                    </button>
                                    <Icon
                                        size={16}
                                        className="mr-2 shrink-0 text-muted-foreground"
                                        aria-hidden="true"
                                    />
                                    <button
                                        type="button"
                                        onFocus={() => setSelected(node.id)}
                                        onClick={(event) =>
                                            openNode(
                                                node,
                                                event.ctrlKey || event.metaKey,
                                            )
                                        }
                                        className="min-w-0 flex-1 truncate py-2 text-left text-sm focus-visible:outline-none"
                                    >
                                        {node.title}
                                    </button>
                                    <button
                                        type="button"
                                        aria-label={`Actions for ${node.title}`}
                                        onClick={() => {
                                            setSelected(node.id);
                                            setActionsId(node.id);
                                        }}
                                        className="rounded-md p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-background hover:text-foreground focus:opacity-100"
                                    >
                                        <MoreHorizontal size={16} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
                {selectedNode ? (
                    <NodeActions
                        workspaceId={workspaceId}
                        node={{
                            ...selectedNode,
                            tags:
                                localTags[selectedNode.id] ?? selectedNode.tags,
                        }}
                        nodes={nodes}
                        onClose={() => setActionsId(null)}
                        onDismiss={onClose}
                        onTagsSaved={(id, tags) =>
                            setLocalTags((previous) => ({
                                ...previous,
                                [id]: tags,
                            }))
                        }
                        onOpen={onOpen}
                        onMove={move}
                    />
                ) : (
                    <div className="border-t border-border/70 px-5 py-3 text-xs text-muted-foreground">
                        ↑ ↓ Navigate <span className="mx-1">·</span> Enter Open{' '}
                        <span className="mx-1">·</span> Drag to move
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
