import { useRef, useState, type DragEvent } from 'react';
import type { TreeNode } from '@/components/navigation/navigation-types';

type Placement = 'before' | 'inside' | 'after';
type DropHint = { targetId: number; placement: Placement };
export type MoveItem = (
    nodeId: number,
    parentId: number | null,
    position: number,
) => void;

function resolvePlacement(event: DragEvent<HTMLElement>): Placement {
    const bounds = event.currentTarget.getBoundingClientRect();
    const horizontal = (event.clientX - bounds.left) / bounds.width;
    const vertical = (event.clientY - bounds.top) / bounds.height;
    if (horizontal < 0.24 || vertical < 0.18) return 'before';
    if (horizontal > 0.76 || vertical > 0.82) return 'after';
    return 'inside';
}

function canDrop(
    nodes: TreeNode[],
    source: TreeNode,
    target: TreeNode,
    placement: Placement,
) {
    if (source.id === target.id) return false;
    if (placement !== 'inside') return source.parent_id === target.parent_id;
    if (
        target.type === 'document' ||
        (target.type === 'database' && source.type !== 'document')
    )
        return false;
    const visited = new Set<number>();
    let ancestor: TreeNode | undefined = target;
    while (ancestor) {
        if (ancestor.id === source.id || visited.has(ancestor.id)) return false;
        visited.add(ancestor.id);
        const parentId: number | null = ancestor.parent_id;
        ancestor = nodes.find((node) => node.id === parentId);
    }
    return true;
}

export function useItemDrag(
    nodes: TreeNode[],
    workspaceId: number,
    onMove: MoveItem,
    disabled: boolean,
) {
    const [draggedId, setDraggedId] = useState<number | null>(null);
    const [dropHint, setDropHint] = useState<DropHint | null>(null);
    const preview = useRef<HTMLElement | null>(null);

    function clearDrag() {
        setDraggedId(null);
        setDropHint(null);
        preview.current?.remove();
        preview.current = null;
    }

    function inspect(event: DragEvent<HTMLElement>, target: TreeNode) {
        const source = nodes.find((node) => node.id === draggedId);
        const placement = resolvePlacement(event);
        if (disabled || !source || !canDrop(nodes, source, target, placement)) {
            event.dataTransfer.dropEffect = 'none';
            setDropHint(null);
            return;
        }
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        setDropHint({ targetId: target.id, placement });
    }

    function drop(event: DragEvent<HTMLElement>, target: TreeNode) {
        event.preventDefault();
        const source = nodes.find((node) => node.id === draggedId);
        const placement = resolvePlacement(event);
        clearDrag();
        if (disabled || !source || !canDrop(nodes, source, target, placement))
            return;
        const parentId = placement === 'inside' ? target.id : target.parent_id;
        const siblings = nodes
            .filter(
                (node) => node.parent_id === parentId && node.id !== source.id,
            )
            .sort((a, b) => a.position - b.position || a.id - b.id);
        const position =
            placement === 'inside'
                ? siblings.length
                : siblings.findIndex((node) => node.id === target.id) +
                  (placement === 'after' ? 1 : 0);
        onMove(source.id, parentId, position);
    }

    function dragHandlers(node: TreeNode) {
        return {
            draggable: !disabled,
            onDragStart(event: DragEvent<HTMLElement>) {
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData(
                    'application/orbium-node',
                    String(node.id),
                );
                event.dataTransfer.setData(
                    `application/orbium-workspace-${workspaceId}`,
                    'true',
                );
                const copy = event.currentTarget.cloneNode(true) as HTMLElement;
                copy.querySelector('button')?.remove();
                copy.className = 'floating-item floating-drag-preview';
                copy.style.width = `${event.currentTarget.offsetWidth}px`;
                document.body.appendChild(copy);
                preview.current = copy;
                event.dataTransfer.setDragImage(copy, 30, 28);
                setDraggedId(node.id);
            },
            onDragOver: (event: DragEvent<HTMLElement>) => inspect(event, node),
            onDrop: (event: DragEvent<HTMLElement>) => drop(event, node),
            onDragEnd: clearDrag,
            onDragLeave(event: DragEvent<HTMLElement>) {
                if (
                    !(event.relatedTarget instanceof Node) ||
                    !event.currentTarget.contains(event.relatedTarget)
                )
                    setDropHint(null);
            },
        };
    }
    return { draggedId, dropHint, dragHandlers };
}
