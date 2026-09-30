import gsap from 'gsap';
import { Database, FileText, Folder, Orbit } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { layoutOrbitalChildren, maximumVisibleOrbs } from './orbit-layout';
import { consumeOrbitArrival } from './orbit-navigation';
import type { OrbitNode } from './orbit-types';

type Props = {
    workspaceId: number;
    center: OrbitNode;
    nodes: OrbitNode[];
    selectedId: number | null;
    onSelect: (id: number) => void;
    onOpen: (node: OrbitNode, source: HTMLElement | null) => void;
    reducedMotion: boolean;
};

const icons = {
    workspace: Orbit,
    folder: Folder,
    document: FileText,
    database: Database,
};

export default function OrbitSystem({
    workspaceId,
    center,
    nodes,
    selectedId,
    onSelect,
    onOpen,
    reducedMotion,
}: Props) {
    const system = useRef<HTMLDivElement>(null);
    const arrival = useRef<ReturnType<typeof consumeOrbitArrival> | undefined>(
        undefined,
    );
    const [hoveredId, setHoveredId] = useState<number | null>(null);
    const placements = useMemo(
        () => layoutOrbitalChildren(nodes.slice(0, maximumVisibleOrbs)),
        [nodes],
    );
    const CenterIcon = icons[center.type];

    useEffect(() => {
        if (arrival.current === undefined)
            arrival.current = consumeOrbitArrival(workspaceId, center.id);
        if (reducedMotion || !system.current) return;
        const centerOrb = system.current.querySelector('.orbium-center');
        const children = system.current.querySelectorAll('.orbium-child');
        const stage = system.current.getBoundingClientRect();
        const fromX = arrival.current
            ? ((arrival.current.x - 50) / 100) * stage.width
            : 0;
        const fromY = arrival.current
            ? ((arrival.current.y - 54) / 100) * stage.height
            : 0;
        const timeline = gsap.timeline();
        timeline.fromTo(
            centerOrb,
            {
                opacity: arrival.current ? 0.5 : 0,
                scale: arrival.current ? 0.55 : 0.88,
                x: fromX,
                y: fromY,
            },
            {
                opacity: 1,
                scale: 1,
                x: 0,
                y: 0,
                duration: 0.56,
                ease: 'power3.out',
                clearProps: 'transform,opacity',
            },
        );
        timeline.fromTo(
            children,
            { opacity: 0, scale: 0.55 },
            {
                opacity: 1,
                scale: 1,
                duration: 0.48,
                ease: 'power3.out',
                stagger: 0.025,
                clearProps: 'transform,opacity',
            },
            0.2,
        );
        return () => {
            timeline.kill();
        };
    }, [workspaceId, center.id, reducedMotion]);

    const rings = [...new Set(placements.map((placement) => placement.ring))];

    return (
        <div ref={system} className="orbium-orbit-system">
            <div aria-hidden="true" className="orbium-system-light" />
            <svg
                aria-hidden="true"
                className="orbium-orbit-paths"
                viewBox="0 0 1000 700"
                preserveAspectRatio="none"
            >
                {rings.map((ring) => {
                    const radii = [
                        [220, 126],
                        [340, 189],
                        [440, 252],
                    ][ring];
                    return (
                        <ellipse
                            key={ring}
                            cx="500"
                            cy="378"
                            rx={radii[0]}
                            ry={radii[1]}
                        />
                    );
                })}
            </svg>
            <div className="orbium-center-anchor">
                <div className="orbium-center">
                    <div className="orbium-center-surface">
                        <CenterIcon
                            aria-hidden="true"
                            size={34}
                            strokeWidth={1.25}
                        />
                        <span className="orbium-center-title">
                            {center.title}
                        </span>
                        <span className="orbium-center-type">
                            {center.type}
                        </span>
                    </div>
                </div>
            </div>
            {placements.map(({ node, x, y, depth, ring, delay }) => {
                const Icon = icons[node.type];
                const selected = selectedId === node.id;
                const active = selected || hoveredId === node.id;
                return (
                    <div
                        key={node.id}
                        data-orbit-node-id={node.id}
                        className={`orbium-child orbium-child-ring-${ring}${selected ? ' is-selected' : ''}${selectedId && !selected ? ' is-muted' : ''}`}
                        style={
                            {
                                left: `${x}%`,
                                top: `${y}%`,
                                zIndex: Math.round(20 + depth * 10),
                                '--orb-delay': `${delay}s`,
                            } as React.CSSProperties
                        }
                    >
                        <button
                            type="button"
                            className="orbium-child-target"
                            aria-label={`${selected ? 'Open' : 'Select'} ${node.title}, ${node.type}`}
                            aria-pressed={selected}
                            onPointerEnter={() => setHoveredId(node.id)}
                            onPointerLeave={() => setHoveredId(null)}
                            onFocus={() => setHoveredId(node.id)}
                            onBlur={() => setHoveredId(null)}
                            onClick={(event) => {
                                if (selected)
                                    onOpen(
                                        node,
                                        event.currentTarget.closest<HTMLElement>(
                                            '.orbium-child',
                                        ),
                                    );
                                else onSelect(node.id);
                            }}
                            onDoubleClick={(event) =>
                                onOpen(
                                    node,
                                    event.currentTarget.closest<HTMLElement>(
                                        '.orbium-child',
                                    ),
                                )
                            }
                        >
                            <span className="orbium-child-surface">
                                <Icon
                                    aria-hidden="true"
                                    size={ring === 0 ? 27 : 22}
                                    strokeWidth={1.3}
                                />
                            </span>
                            <span className="orbium-child-caption">
                                <span className="orbium-child-name">
                                    {node.title}
                                </span>
                                <span className="orbium-child-type">
                                    {node.type}
                                </span>
                                {active &&
                                    node.metadata?.slice(0, 2).map((line) => (
                                        <span
                                            key={line}
                                            className="orbium-child-metadata"
                                        >
                                            {line}
                                        </span>
                                    ))}
                            </span>
                        </button>
                    </div>
                );
            })}
            {nodes.length > maximumVisibleOrbs && (
                <span className="orbium-more-count">
                    +{nodes.length - maximumVisibleOrbs} more in Browse items
                </span>
            )}
        </div>
    );
}
