import type { OrbitNode } from './orbit-types';

export type OrbitalPlacement = {
    node: OrbitNode;
    x: number;
    y: number;
    depth: number;
    ring: number;
    delay: number;
};

const ringCapacities = [6, 9, 12];
const ringRadii = [
    { x: 22, y: 18 },
    { x: 34, y: 27 },
    { x: 44, y: 36 },
];

export const maximumVisibleOrbs = ringCapacities.reduce(
    (total, capacity) => total + capacity,
    0,
);

export function layoutOrbitalChildren(nodes: OrbitNode[]): OrbitalPlacement[] {
    const placements: OrbitalPlacement[] = [];
    let offset = 0;

    ringCapacities.forEach((capacity, ring) => {
        const count = Math.min(capacity, nodes.length - offset);
        if (count <= 0) return;
        const radius = ringRadii[ring];
        for (let index = 0; index < count; index++) {
            const node = nodes[offset + index];
            const stagger = ring === 0 ? -0.38 : ring * 0.32;
            const angle = (index / count) * Math.PI * 2 + stagger;
            const variation = ((node.id * 17) % 7) - 3;
            const depth = Math.sin(angle);
            placements.push({
                node,
                x: 50 + Math.cos(angle) * (radius.x + variation * 0.35),
                y: 54 + depth * (radius.y + variation * 0.25),
                depth,
                ring,
                delay: Math.min(index * 0.035 + ring * 0.06, 0.42),
            });
        }
        offset += count;
    });

    return placements;
}
