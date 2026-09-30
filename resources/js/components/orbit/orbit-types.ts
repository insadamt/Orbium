export type OrbitNode = {
    id: number;
    title: string;
    type: 'workspace' | 'folder' | 'document' | 'database';
    metadata?: string[];
};

export type OrbitPosition = [number, number, number];
export type OrbitCameraState = {
    position: OrbitPosition;
    target: OrbitPosition;
};
export type OrbitQuality = 'low' | 'balanced' | 'high';

export function layoutOrbitChildren(nodes: OrbitNode[]) {
    let offset = 0;
    let ring = 0;
    const positions = new Map<number, OrbitPosition>();
    while (offset < nodes.length) {
        const capacity = 8 + ring * 6;
        const count = Math.min(capacity, nodes.length - offset);
        const radius = 3.6 + ring * 2.5;
        for (let index = 0; index < count; index++) {
            const node = nodes[offset + index];
            const angle = (index / count) * Math.PI * 2 + ring * 0.43;
            const variation = ((node.id * 37) % 11) / 55;
            positions.set(node.id, [
                Math.cos(angle) * (radius + variation),
                (((node.id * 17) % 7) - 3) * 0.08,
                Math.sin(angle) * (radius + variation),
            ]);
        }
        offset += count;
        ring++;
    }
    return { positions, radius: ring ? 3.6 + (ring - 1) * 2.5 : 3.6 };
}
