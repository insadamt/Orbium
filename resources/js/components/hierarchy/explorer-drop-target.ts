import type { TreeNode } from '@/components/navigation/navigation-types';

export type DropHint = {
    targetId: number;
    placement: 'before' | 'inside' | 'after';
};
export type DropDestination = {
    parentId: number | null;
    position: number;
    hint: DropHint | null;
    parentZone: HTMLElement | null;
    element: HTMLElement;
};

function canDropInside(
    nodes: TreeNode[],
    sources: TreeNode[],
    target: TreeNode,
) {
    if (
        target.type === 'document' ||
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

export function findExplorerDropDestination(
    container: Element,
    nodes: TreeNode[],
    sources: TreeNode[],
    x: number,
    y: number,
): DropDestination | null {
    const hovered = document.elementFromPoint(x, y);
    if (!hovered || !container.contains(hovered)) return null;
    const sourceIds = new Set(sources.map((source) => source.id));
    const siblingsAt = (parentId: number | null) =>
        nodes
            .filter(
                (node) =>
                    node.parent_id === parentId && !sourceIds.has(node.id),
            )
            .sort((a, b) => a.position - b.position || a.id - b.id);
    const parentZone = hovered.closest<HTMLElement>(
        '.floating-parent-drop-zone',
    );
    if (parentZone) {
        const currentFolder = nodes.find(
            (node) => node.id === sources[0]?.parent_id,
        );
        if (!currentFolder || currentFolder.type !== 'folder') return null;
        return {
            parentId: currentFolder.parent_id,
            position: siblingsAt(currentFolder.parent_id).length,
            hint: null,
            parentZone,
            element: parentZone,
        };
    }
    const element = hovered.closest<HTMLElement>('[data-node-id]');
    const target = nodes.find(
        (node) => node.id === Number(element?.dataset.nodeId),
    );
    if (!element || !target || sourceIds.has(target.id)) return null;
    const bounds = element.getBoundingClientRect();
    const horizontal = (x - bounds.left) / bounds.width;
    const vertical = (y - bounds.top) / bounds.height;
    const placement =
        element.dataset.view === 'list'
            ? vertical < 0.25
                ? 'before'
                : vertical > 0.75
                  ? 'after'
                  : 'inside'
            : horizontal < 0.24 || vertical < 0.18
              ? 'before'
              : horizontal > 0.76 || vertical > 0.82
                ? 'after'
                : 'inside';
    if (
        placement === 'inside'
            ? !canDropInside(nodes, sources, target)
            : sources.some((source) => source.parent_id !== target.parent_id)
    )
        return null;
    const parentId = placement === 'inside' ? target.id : target.parent_id;
    const siblings = siblingsAt(parentId);
    return {
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
