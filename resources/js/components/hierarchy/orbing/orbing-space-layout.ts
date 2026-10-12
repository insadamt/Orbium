import type { TreeNode } from '@/components/navigation/navigation-types';
import type { OrbingEntity, WorldBounds, WorldPoint } from './orbing-layout';

type MeasuredEntity = {
    node: TreeNode;
    children: MeasuredEntity[];
    footprint: number;
    clusterRadius: number;
};

export type OrbingSpace = { entities: OrbingEntity[]; bounds: WorldBounds };
const nestedScale = 0.78;

function measureEntity(
    node: TreeNode,
    childrenByParent: Map<number | null, TreeNode[]>,
    ancestry: Set<number>,
): MeasuredEntity {
    const descendants = new Set([...ancestry, node.id]);
    const children =
        node.type === 'document'
            ? []
            : (childrenByParent.get(node.id) ?? [])
                  .filter((child) => !descendants.has(child.id))
                  .map((child) =>
                      measureEntity(child, childrenByParent, descendants),
                  );
    if (children.length === 0)
        return {
            node,
            children,
            footprint: node.type === 'document' ? 64 : 82,
            clusterRadius: 0,
        };
    const largestChild = Math.max(
        ...children.map((child) => child.footprint * nestedScale),
    );
    const circumference = children.reduce(
        (sum, child) => sum + child.footprint * nestedScale * 2 + 80,
        0,
    );
    const clusterRadius = Math.max(
        150,
        largestChild + 80,
        circumference / (Math.PI * 2),
    );
    return {
        node,
        children,
        clusterRadius,
        footprint: clusterRadius * 1.28 + largestChild + 72,
    };
}

function scatterRootEntities(roots: MeasuredEntity[]) {
    const placements: { root: MeasuredEntity; point: WorldPoint }[] = [];
    const spacing = Math.max(
        200,
        Math.sqrt(
            roots.reduce((sum, root) => sum + root.footprint ** 2, 0) /
                Math.max(1, roots.length),
        ) * 2,
    );
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    for (const [index, root] of roots.entries()) {
        let point: WorldPoint = { x: 0, y: 0 };
        let placed = false;
        for (let attempt = 0; attempt < 40; attempt++) {
            const radius =
                Math.sqrt(index) * spacing + attempt * (root.footprint + 60);
            const angle = index * goldenAngle + attempt * 0.38;
            point = {
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius,
            };
            if (
                placements.every(
                    (existing) =>
                        Math.hypot(
                            existing.point.x - point.x,
                            existing.point.y - point.y,
                        ) >=
                        existing.root.footprint + root.footprint + 70,
                )
            ) {
                placed = true;
                break;
            }
        }
        if (!placed)
            point = {
                x:
                    Math.max(
                        ...placements.map(
                            (existing) =>
                                existing.point.x + existing.root.footprint,
                        ),
                    ) +
                    root.footprint +
                    100,
                y: point.y,
            };
        placements.push({ root, point });
    }
    return placements;
}

function appendEntity(
    entities: OrbingEntity[],
    entity: MeasuredEntity,
    point: WorldPoint,
    depth: number,
    scale: number,
    childDistance = 0,
    orbitAngle = 0,
    orbitSpeed = 0,
) {
    entities.push({
        ...point,
        node: entity.node,
        depth,
        scale,
        footprint: entity.footprint * scale,
        childCount: entity.children.length,
        childDistance,
        orbitAngle,
        orbitSpeed,
    });
    const weights = entity.children.map(
        (child) => child.footprint * nestedScale * 2 + 80,
    );
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    let offset = 0;
    for (const [index, child] of entity.children.entries()) {
        const angle =
            -Math.PI * 0.75 +
            ((offset + weights[index] / 2) / total) * Math.PI * 2;
        const radius =
            entity.clusterRadius *
            scale *
            (1.14 + Math.sin(child.node.id * 2.4) * 0.14);
        appendEntity(
            entities,
            child,
            {
                x: point.x + Math.cos(angle) * radius,
                y: point.y + Math.sin(angle) * radius,
            },
            depth + 1,
            scale * nestedScale,
            radius,
            angle,
            ((Math.PI * 2) / (300 + (entity.node.id % 7) * 30)) *
                (depth % 2 ? -1 : 1),
        );
        offset += weights[index];
    }
}

function boundsForRoots(
    placements: { root: MeasuredEntity; point: WorldPoint }[],
): WorldBounds {
    if (!placements.length) return { x: 0, y: 0, width: 480, height: 360 };
    const left = Math.min(
        ...placements.map(({ root, point }) => point.x - root.footprint),
    );
    const right = Math.max(
        ...placements.map(({ root, point }) => point.x + root.footprint),
    );
    const top = Math.min(
        ...placements.map(({ root, point }) => point.y - root.footprint),
    );
    const bottom = Math.max(
        ...placements.map(({ root, point }) => point.y + root.footprint),
    );
    return {
        x: (left + right) / 2,
        y: (top + bottom) / 2,
        width: right - left + 40,
        height: bottom - top + 40,
    };
}

export function layoutOrbingSpace(nodes: TreeNode[]): OrbingSpace {
    const childrenByParent = new Map<number | null, TreeNode[]>();
    const ordered = [...nodes].sort(
        (left, right) => left.position - right.position || left.id - right.id,
    );
    for (const node of ordered) {
        const siblings = childrenByParent.get(node.parent_id) ?? [];
        siblings.push(node);
        childrenByParent.set(node.parent_id, siblings);
    }
    const roots = (childrenByParent.get(null) ?? []).map((node) =>
        measureEntity(node, childrenByParent, new Set()),
    );
    const placements = scatterRootEntities(roots);
    const bounds = boundsForRoots(placements);
    const entities: OrbingEntity[] = [];
    for (const { root, point } of placements)
        appendEntity(
            entities,
            root,
            { x: point.x - bounds.x, y: point.y - bounds.y },
            0,
            1,
        );
    return { entities, bounds: { ...bounds, x: 0, y: 0 } };
}

export function boundsForContainer(
    space: OrbingSpace,
    parentId: number | null,
): WorldBounds {
    const parent = space.entities.find((entity) => entity.node.id === parentId);
    return parent
        ? {
              x: parent.x,
              y: parent.y,
              width: parent.footprint * 2,
              height: parent.footprint * 2,
          }
        : space.bounds;
}

export function filterOrbingBranches(
    space: OrbingSpace,
    parentId: number | null,
    query: string,
) {
    if (!query) return new Set(space.entities.map((entity) => entity.node.id));
    const matches = new Set(
        space.entities
            .filter(
                (entity) =>
                    entity.node.parent_id === parentId &&
                    entity.node.title.toLocaleLowerCase().includes(query),
            )
            .map((entity) => entity.node.id),
    );
    const visible = new Set(matches);
    const byId = new Map(
        space.entities.map((entity) => [entity.node.id, entity]),
    );
    for (const id of matches) {
        let parent = byId.get(id)?.node.parent_id;
        while (parent != null && !visible.has(parent)) {
            visible.add(parent);
            parent = byId.get(parent)?.node.parent_id;
        }
    }
    for (const entity of space.entities) {
        if (
            entity.node.parent_id !== null &&
            visible.has(entity.node.parent_id) &&
            !matches.has(entity.node.id)
        ) {
            let ancestor = entity.node.parent_id;
            while (byId.has(ancestor)) {
                if (matches.has(ancestor)) {
                    visible.add(entity.node.id);
                    break;
                }
                const next = byId.get(ancestor)?.node.parent_id;
                if (next == null) break;
                ancestor = next;
            }
        }
    }
    return visible;
}
