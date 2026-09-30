import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import gsap from 'gsap';
import { Database, Folder } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Group, Mesh } from 'three';
import type { OrbitNode, OrbitPosition, OrbitQuality } from './orbit-types';

type Props = {
    node: OrbitNode;
    position: OrbitPosition;
    central?: boolean;
    dark: boolean;
    quality: OrbitQuality;
    visualScale: number;
    reducedMotion: boolean;
    paused: boolean;
    selected?: boolean;
    showLabel?: boolean;
    onSelect?: () => void;
    onOpen?: () => void;
};

export function OrbitObject({
    node,
    position,
    central = false,
    dark,
    quality,
    visualScale,
    reducedMotion,
    paused,
    selected,
    showLabel,
    onSelect,
    onOpen,
}: Props) {
    const group = useRef<Group>(null);
    const mesh = useRef<Mesh>(null);
    const drift = useRef(0);
    const [hovered, setHovered] = useState(false);
    const emphasized = hovered || selected;
    const size =
        (central ? 0.87 : node.type === 'document' ? 0.32 : 0.39) * visualScale;
    const segments = quality === 'low' ? 24 : quality === 'high' ? 64 : 40;
    useEffect(() => {
        if (!group.current) return;
        if (reducedMotion) {
            group.current.scale.setScalar(1);
            return;
        }
        const tween = gsap.fromTo(
            group.current.scale,
            { x: 0.01, y: 0.01, z: 0.01 },
            { x: 1, y: 1, z: 1, duration: 0.65, ease: 'power2.out' },
        );
        return () => {
            tween.kill();
        };
    }, [reducedMotion]);
    useFrame((_, delta) => {
        if (!group.current || !mesh.current) return;
        if (!reducedMotion && !paused && !emphasized)
            drift.current += Math.min(delta, 0.05) * 0.035;
        const angle = reducedMotion ? 0 : Math.sin(drift.current) * 0.018;
        group.current.position.set(
            position[0] * Math.cos(angle) - position[2] * Math.sin(angle),
            position[1],
            position[2] * Math.cos(angle) + position[0] * Math.sin(angle),
        );
        if (!reducedMotion && !paused && !emphasized)
            mesh.current.rotation.y += Math.min(delta, 0.05) * 0.06;
        const target = emphasized ? 1.12 : 1;
        const scale = reducedMotion
            ? target
            : mesh.current.scale.x +
              (target - mesh.current.scale.x) * Math.min(delta * 10, 1);
        mesh.current.scale.setScalar(scale);
    });
    return (
        <group ref={group} position={position}>
            <mesh
                ref={mesh}
                onPointerOver={(event) => {
                    event.stopPropagation();
                    setHovered(true);
                }}
                onPointerOut={() => setHovered(false)}
                onClick={(event) => {
                    event.stopPropagation();
                    onSelect?.();
                }}
                onDoubleClick={(event) => {
                    event.stopPropagation();
                    onOpen?.();
                }}
            >
                {node.type === 'database' ? (
                    <icosahedronGeometry args={[size, 1]} />
                ) : (
                    <sphereGeometry args={[size, segments, segments]} />
                )}
                <meshPhysicalMaterial
                    color={central ? '#292b2f' : dark ? '#aeb1b6' : '#e2e0dc'}
                    roughness={
                        central ? 0.58 : node.type === 'document' ? 0.28 : 0.48
                    }
                    metalness={central ? 0.34 : 0.08}
                    clearcoat={central ? 0.22 : 0.55}
                    clearcoatRoughness={0.26}
                    emissive={
                        central ? '#16181c' : dark ? '#73777f' : '#bbb9b5'
                    }
                    emissiveIntensity={emphasized ? 0.16 : 0.025}
                />
            </mesh>
            {central && quality !== 'low' && (
                <mesh scale={1.055}>
                    <sphereGeometry args={[size, segments, segments]} />
                    <meshBasicMaterial
                        color={dark ? '#f2f0ed' : '#ffffff'}
                        transparent
                        opacity={0.07}
                        depthWrite={false}
                    />
                </mesh>
            )}
            {node.type === 'database' && (
                <mesh rotation={[Math.PI / 2.7, 0.2, 0]}>
                    <torusGeometry
                        args={[size * 1.45, 0.018, 6, segments * 2]}
                    />
                    <meshStandardMaterial
                        color={dark ? '#e2e1df' : '#aeb0b0'}
                        roughness={0.35}
                        metalness={0.45}
                    />
                </mesh>
            )}
            {(central || showLabel || emphasized) && (
                <Html
                    position={
                        central ? [0, 0, size + 0.03] : [0, -size - 0.25, 0]
                    }
                    center
                    zIndexRange={[8, 0]}
                    style={{ pointerEvents: central ? 'none' : 'auto' }}
                >
                    {central ? (
                        <span className="flex max-w-52 flex-col items-center gap-2 text-center text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
                            {node.type === 'database' ? (
                                <Database size={27} strokeWidth={1.4} />
                            ) : (
                                <Folder size={27} strokeWidth={1.4} />
                            )}
                            <span className="max-w-52 truncate text-lg font-medium tracking-tight">
                                {node.title}
                            </span>
                        </span>
                    ) : (
                        <button
                            onPointerEnter={() => setHovered(true)}
                            onPointerLeave={() => setHovered(false)}
                            onClick={onSelect}
                            onDoubleClick={onOpen}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    event.preventDefault();
                                    onOpen?.();
                                }
                            }}
                            aria-label={`Select ${node.title}`}
                            aria-pressed={!!selected}
                            className={`max-w-40 rounded-lg border px-2.5 py-1.5 text-center text-xs shadow-sm backdrop-blur-md ${emphasized ? 'border-foreground/30 bg-background/95' : 'border-transparent bg-background/75'} focus-visible:ring-2 focus-visible:ring-ring`}
                        >
                            <span className="block truncate">{node.title}</span>
                            {emphasized && (
                                <span className="mt-1 block text-[10px] text-muted-foreground">
                                    {node.type}
                                </span>
                            )}
                            {emphasized &&
                                node.metadata?.map((line, index) => (
                                    <span
                                        key={index}
                                        className="mt-1 block max-w-40 truncate text-[10px] text-muted-foreground"
                                    >
                                        {line}
                                    </span>
                                ))}
                        </button>
                    )}
                </Html>
            )}
        </group>
    );
}
