import type { RefObject } from 'react';
import {
    projectWorldPoint,
    type OrbingCamera,
    type OrbingEntity,
    type OrbingLink,
    type WorldPoint,
    type ViewportSize,
} from './orbing-layout';

export type ProjectionOptions = {
    viewportRef: RefObject<HTMLDivElement | null>;
    entities: OrbingEntity[];
    mentionLinks: OrbingLink[];
    positions: Map<number, WorldPoint>;
    camera: OrbingCamera;
    size: ViewportSize;
    visibleIds: Set<number>;
    selectedId: number | null;
    hoveredId: number | null;
    parentId: number | null;
};

function collectAncestorIds(
    entities: Map<number, OrbingEntity>,
    startingIds: (number | null)[],
) {
    const ancestors = new Set<number>();
    for (let id of startingIds) {
        while (id !== null && !ancestors.has(id)) {
            ancestors.add(id);
            id = entities.get(id)?.node.parent_id ?? null;
        }
    }
    return ancestors;
}

function collectExpandedIds(options: ProjectionOptions) {
    const byId = new Map(
        options.entities.map((entity) => [entity.node.id, entity]),
    );
    const ancestors = collectAncestorIds(byId, [
        options.selectedId,
        options.parentId,
    ]);
    const expanded = new Set<number>();
    for (const entity of options.entities) {
        const parent = entity.node.parent_id;
        if (
            options.visibleIds.has(entity.node.id) &&
            (parent === null ||
                ancestors.has(entity.node.id) ||
                parent === options.parentId ||
                (expanded.has(parent) &&
                    entity.childDistance * options.camera.zoom >= 76))
        )
            expanded.add(entity.node.id);
    }
    return expanded;
}

export function collectOrbingElements(viewport: HTMLElement) {
    return {
        entities: viewport.querySelectorAll<HTMLElement>('[data-node-id]'),
        connections: viewport.querySelectorAll<SVGLineElement>(
            '[data-orbing-connection]',
        ),
        orbits: viewport.querySelectorAll<SVGCircleElement>(
            '[data-orbing-orbit]',
        ),
    };
}

function paintOrbitPaths({
    options,
    circles,
    expanded,
    emphasizedId,
}: {
    options: ProjectionOptions;
    circles: NodeListOf<SVGCircleElement>;
    expanded: Set<number>;
    emphasizedId: number | null;
}) {
    const byId = new Map(
        options.entities.map((entity) => [entity.node.id, entity]),
    );
    for (const circle of circles) {
        const id = Number(circle.dataset.orbingOrbit);
        const child = byId.get(id);
        const parentId = child?.node.parent_id;
        const parent =
            parentId == null ? undefined : options.positions.get(parentId);
        const visible =
            parent &&
            parentId != null &&
            expanded.has(id) &&
            expanded.has(parentId);
        circle.style.display = visible ? '' : 'none';
        if (!visible || !child || !parent) continue;
        const center = projectWorldPoint(parent, options.camera, options.size);
        circle.setAttribute('cx', String(center.x));
        circle.setAttribute('cy', String(center.y));
        circle.setAttribute(
            'r',
            String(child.childDistance * options.camera.zoom),
        );
        circle.dataset.highlighted = String(
            id === emphasizedId || parentId === emphasizedId,
        );
    }
}

export function paintOrbingFrame(
    options: ProjectionOptions,
    elements: ReturnType<typeof collectOrbingElements>,
) {
    const { entities, camera, size, selectedId } = options;
    const expanded = collectExpandedIds(options);
    const byId = new Map(entities.map((entity) => [entity.node.id, entity]));
    const emphasizedId = options.hoveredId ?? selectedId;
    paintOrbitPaths({
        options,
        circles: elements.orbits,
        expanded,
        emphasizedId,
    });
    const selected = emphasizedId === null ? undefined : byId.get(emphasizedId);
    const related = new Set<number>();
    if (selected && options.visibleIds.has(selected.node.id)) {
        related.add(selected.node.id);
        if (selected.node.parent_id !== null)
            related.add(selected.node.parent_id);
        for (const entity of entities) {
            if (
                entity.node.parent_id === selected.node.id ||
                (selected.node.parent_id !== null &&
                    entity.node.parent_id === selected.node.parent_id)
            )
                related.add(entity.node.id);
        }
    }
    if (selected) {
        for (const link of options.mentionLinks) {
            if (link.sourceId === selected.node.id) related.add(link.targetId);
            if (link.targetId === selected.node.id) related.add(link.sourceId);
        }
    }
    const parentsWithVisibleChildren = new Set(
        entities
            .filter((entity) => expanded.has(entity.node.id))
            .map((entity) => entity.node.parent_id),
    );
    for (const element of elements.entities) {
        const id = Number(element.dataset.nodeId);
        const entity = byId.get(id);
        if (!entity) continue;
        const point = projectWorldPoint(
            options.positions.get(id) ?? entity,
            camera,
            size,
        );
        element.hidden =
            !expanded.has(id) ||
            point.x < -150 ||
            point.y < -100 ||
            point.x > size.width + 150 ||
            point.y > size.height + 100;
        if (element.hidden) continue;
        element.style.left = `${point.x}px`;
        element.style.top = `${point.y}px`;
        element.dataset.labels = String(
            id === selectedId ||
                id === emphasizedId ||
                entity.node.type !== 'document' ||
                camera.zoom * entity.scale > 0.45,
        );
        element.dataset.collapsed = String(
            entity.childCount > 0 && !parentsWithVisibleChildren.has(id),
        );
        element.dataset.dimmed = String(related.size > 0 && !related.has(id));
    }
    for (const line of elements.connections) {
        const sourceId = Number(line.dataset.sourceId);
        const targetId = Number(line.dataset.targetId);
        const source = options.positions.get(sourceId);
        const target = options.positions.get(targetId);
        line.style.display =
            source && target && expanded.has(sourceId) && expanded.has(targetId)
                ? ''
                : 'none';
        if (!source || !target || line.style.display === 'none') continue;
        const start = projectWorldPoint(source, camera, size);
        const end = projectWorldPoint(target, camera, size);
        line.setAttribute('x1', String(start.x));
        line.setAttribute('y1', String(start.y));
        line.setAttribute('x2', String(end.x));
        line.setAttribute('y2', String(end.y));
        line.dataset.highlighted = String(
            sourceId === emphasizedId || targetId === emphasizedId,
        );
        line.dataset.dimmed = String(
            related.size > 0 &&
                !(related.has(sourceId) && related.has(targetId)),
        );
    }
}
