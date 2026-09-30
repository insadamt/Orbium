import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/navigation/navigation-dialog';
import { NodeActions } from '@/components/navigation/node-actions';
import {
    nodeUrl,
    type TreeNode,
} from '@/components/navigation/navigation-types';
import { openLocation } from '@/components/navigation/tab-navigation';
import { usePageSearch } from '@/components/navigation/page-search';
import { FloatingItem } from './floating-item';
import { useItemDrag } from './use-item-drag';

export function WorkspaceContents({
    workspaceId,
    nodes,
    parentId,
}: {
    workspaceId: number;
    nodes: TreeNode[];
    parentId: number | null;
}) {
    const focusId = Number(
        new URLSearchParams(window.location.search).get('focus'),
    );
    const [selectedId, setSelectedId] = useState<number | null>(
        focusId || null,
    );
    const [actionsId, setActionsId] = useState<number | null>(null);
    const [moving, setMoving] = useState(false);
    const [announcement, setAnnouncement] = useState('');
    const [localTags, setLocalTags] = useState<Record<number, string[]>>({});
    const search = usePageSearch();
    const normalizedQuery = search.query.trim().toLocaleLowerCase();
    const children = nodes
        .filter(
            (node) =>
                node.parent_id === parentId &&
                (!normalizedQuery ||
                    node.title.toLocaleLowerCase().includes(normalizedQuery)),
        )
        .sort((a, b) => a.position - b.position || a.id - b.id);
    useEffect(() => {
        search.setResultCount(normalizedQuery ? children.length : null);
    }, [children.length, normalizedQuery, search.setResultCount]);
    const selectedNode = nodes.find((node) => node.id === actionsId);
    function move(
        nodeId: number,
        destination: number | null,
        position: number,
    ) {
        if (moving) return;
        setMoving(true);
        router.patch(
            `/workspaces/${workspaceId}/nodes/${nodeId}/move`,
            { parent_id: destination, position },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setAnnouncement('Item moved.');
                    setActionsId(null);
                },
                onError: (errors) => toast.error(Object.values(errors)[0]),
                onFinish: () => setMoving(false),
            },
        );
    }
    const { draggedId, dropHint, dragHandlers } = useItemDrag(
        nodes,
        workspaceId,
        move,
        moving,
    );
    function openNode(node: TreeNode, newTab: boolean) {
        openLocation(nodeUrl(workspaceId, node), newTab);
    }
    return (
        <>
            <section
                className="floating-contents"
                aria-label="Current container contents"
                aria-busy={moving}
            >
                {children.map((node, index) => (
                    <FloatingItem
                        key={node.id}
                        node={node}
                        selected={selectedId === node.id}
                        dragging={draggedId === node.id}
                        placement={
                            dropHint?.targetId === node.id
                                ? dropHint.placement
                                : undefined
                        }
                        dragHandlers={dragHandlers(node)}
                        onSelect={() => setSelectedId(node.id)}
                        onOpen={(newTab) => openNode(node, newTab)}
                        onActions={() => setActionsId(node.id)}
                        onReorder={(direction) => {
                            const position = index + direction;
                            if (position >= 0 && position < children.length)
                                move(node.id, parentId, position);
                        }}
                    />
                ))}
            </section>
            {normalizedQuery && children.length === 0 && (
                <p className="floating-no-results" role="status">
                    No items match this search.
                </p>
            )}
            <p className="sr-only" role="status">
                {announcement}
            </p>
            <Dialog
                open={!!selectedNode}
                onOpenChange={(open) => {
                    if (!open) setActionsId(null);
                }}
            >
                <DialogContent className="max-h-[85dvh] overflow-y-auto">
                    <DialogTitle className="sr-only">Item actions</DialogTitle>
                    {selectedNode && (
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
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
