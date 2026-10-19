import type { TreeNode } from '@/components/navigation/navigation-types';

export type DropHint = {
    targetId: number;
    placement: 'before' | 'inside' | 'after';
};
type MoveDropDestination = {
    action: 'move';
    parentId: number | null;
    position: number;
    hint: DropHint | null;
    parentZone: HTMLElement | null;
    element: HTMLElement;
};
export type DropDestination =
    | MoveDropDestination
    | {
          action: 'trash';
          element: HTMLElement;
          hint: null;
          parentZone: null;
      };

function canDropInside(
    nodes: TreeNode[],
    sources: TreeNode[],
    target: TreeNode,
) {
    if (
        (target.type !== 'folder' && target.type !== 'database') ||
        (target.type === 'database' &&
            sources.some((source) => source.type !== 'document'))
    )
        return false;
    const sourceIds = new Set(sources.map((source) => source.id));
    const visited = new Set<number>();
    let ancestor: TreeNode | undefined = target;
    while (ancestor) {
        if (sourceIds.has(ancestor.id) || visited.has(ancestor.id))
            return false;
        visited.add(ancestor.id);
        ancestor = nodes.find((node) => node.id === ancestor?.parent_id);
    }
    return true;
}

function findNearbyDropCard(
    container: Element,
    sourceIds: Set<number>,
    x: number,
    y: number,
) {
    let nearest: HTMLElement | null = null;
    let shortestDistance = 48;
    for (const element of container.querySelectorAll<HTMLElement>(
        '[data-node-id]',
    )) {
        if (sourceIds.has(Number(element.dataset.nodeId))) continue;
        const bounds = element.getBoundingClientRect();
        if (!bounds.width || !bounds.height) continue;
        const distance = Math.hypot(
            Math.max(bounds.left - x, 0, x - bounds.right),
            Math.max(bounds.top - y, 0, y - bounds.bottom),
        );
        if (distance < shortestDistance) {
            nearest = element;
            shortestDistance = distance;
        }
    }
    return nearest;
}

function determineDropPlacement({
    element,
    x,
    y,
    canNest,
}: {
    element: HTMLElement;
    x: number;
    y: number;
    canNest: boolean;
}): DropHint['placement'] {
    const bounds = element.getBoundingClientRect();
    const physicalHorizontal = (x - bounds.left) / bounds.width;
    const horizontal =
        getComputedStyle(element).direction === 'rtl'
            ? 1 - physicalHorizontal
            : physicalHorizontal;
    const vertical = (y - bounds.top) / bounds.height;
    const isList = element.dataset.view === 'list';
    if (!canNest) {
        if (vertical < 0) return 'before';
        if (vertical > 1) return 'after';
        return (isList ? vertical : horizontal) < 0.5 ? 'before' : 'after';
    }
    if (isList) {
        if (vertical < 0.35) return 'before';
        if (vertical > 0.65) return 'after';
    } else {
        if (horizontal < 0.35 || vertical < 0.2) return 'before';
        if (horizontal > 0.65 || vertical > 0.8) return 'after';
    }
    return 'inside';
}

export function findExplorerDropDestination(
    container: Element,
    nodes: TreeNode[],
    sources: TreeNode[],
    x: number,
    y: number,
): DropDestination | null {
    const hovered = document.elementFromPoint(x, y);
    if (!hovered) return null;
    const trashTarget = hovered.closest<HTMLElement>(
        '[data-explorer-trash-target][data-visible="true"]',
    );
    if (
        trashTarget &&
        trashTarget.dataset.workspaceId ===
            container.getAttribute('data-workspace-id')
    ) {
        return {
            action: 'trash',
            element: trashTarget,
            hint: null,
            parentZone: null,
        };
    }
    const sourceIds = new Set(sources.map((source) => source.id));
    const siblingsAt = (parentId: number | null) =>
        nodes
            .filter(
                (node) =>
                    node.parent_id === parentId && !sourceIds.has(node.id),
            )
            .sort((a, b) => a.position - b.position || a.id - b.id);
    const parentZone = hovered.closest<HTMLElement>(
        '[data-explorer-move-out-target][data-visible="true"]',
    );
    if (
        parentZone &&
        parentZone.dataset.workspaceId ===
            container.getAttribute('data-workspace-id')
    ) {
        const currentFolder = nodes.find(
            (node) => node.id === sources[0]?.parent_id,
        );
        if (!currentFolder || currentFolder.type !== 'folder') return null;
        if (sources.some((source) => source.parent_id !== currentFolder.id))
            return null;
        return {
            action: 'move',
            parentId: currentFolder.parent_id,
            position: siblingsAt(currentFolder.parent_id).length,
            hint: null,
            parentZone,
            element: parentZone,
        };
    }
    if (!container.contains(hovered)) return null;
    const hoveredCard = hovered.closest<HTMLElement>('[data-node-id]');
    const element =
        hoveredCard && !sourceIds.has(Number(hoveredCard.dataset.nodeId))
            ? hoveredCard
            : findNearbyDropCard(container, sourceIds, x, y);
    const target = nodes.find(
        (node) => node.id === Number(element?.dataset.nodeId),
    );
    if (!element || !target || sourceIds.has(target.id)) return null;
    const placement = determineDropPlacement({
        element,
        x,
        y,
        canNest:
            hoveredCard === element && canDropInside(nodes, sources, target),
    });
    if (
        placement === 'inside'
            ? !canDropInside(nodes, sources, target)
            : sources.some((source) => source.parent_id !== target.parent_id)
    )
        return null;
    const parentId = placement === 'inside' ? target.id : target.parent_id;
    const siblings = siblingsAt(parentId);
    return {
        action: 'move',
        parentId,
        position:
            placement === 'inside'
                ? siblings.length
                : siblings.findIndex((node) => node.id === target.id) +
                  (placement === 'after' ? 1 : 0),
        hint: { targetId: target.id, placement },
        parentZone: null,
        element,
    };
}
