import { OrbitControls } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import gsap from 'gsap';
import {
    Component,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useAppearance } from '@/hooks/use-appearance';
import { OrbitObject } from './orbit-object';
import {
    layoutOrbitChildren,
    type OrbitCameraState,
    type OrbitNode,
    type OrbitQuality,
} from './orbit-types';

type Props = {
    center: OrbitNode;
    nodes: OrbitNode[];
    selectedId: number | null;
    onSelect: (id: number) => void;
    onOpen: (node: OrbitNode) => void;
    cameraState?: OrbitCameraState;
    onCameraChange: (camera: OrbitCameraState) => void;
    resetVersion: number;
    quality: OrbitQuality;
    reducedMotion: boolean;
    paused: boolean;
    exitingId: number | null;
};

function sceneCameraDistance(
    orbitRadius: number,
    viewport: { width: number; height: number },
) {
    const targetDiameter = Math.min(
        900,
        viewport.width * 0.58,
        viewport.height * 1.12,
    );
    const focalLength = viewport.height / (2 * Math.tan((45 * Math.PI) / 360));
    return Math.max(7.8, (orbitRadius * 2 * focalLength) / targetDiameter);
}

function SceneContents(props: Props & { dark: boolean }) {
    const {
        nodes,
        center,
        dark,
        reducedMotion,
        paused,
        quality,
        selectedId,
        onSelect,
        onOpen,
        resetVersion,
        onCameraChange,
        exitingId,
    } = props;
    const { camera, size } = useThree();
    const controls = useRef<OrbitControlsImpl>(null);
    const layout = useMemo(() => layoutOrbitChildren(nodes), [nodes]);
    const distance = sceneCameraDistance(layout.radius, size);
    const objectScale = Math.min(
        1.45,
        distance / sceneCameraDistance(3.6, size),
    );
    const defaultTarget: [number, number, number] = [
        size.width > 900 ? -0.65 : 0,
        size.width > 900 ? 0.3 : 0,
        0,
    ];
    const initialCamera = useRef(props.cameraState);
    const initialResetVersion = useRef(resetVersion);
    const saveCamera = useRef(onCameraChange);
    useEffect(() => {
        saveCamera.current = onCameraChange;
    }, [onCameraChange]);

    useEffect(() => {
        const saved =
            resetVersion === initialResetVersion.current
                ? initialCamera.current
                : undefined;
        camera.position.fromArray(
            saved?.position ?? [
                defaultTarget[0],
                distance * 0.5 + defaultTarget[1],
                distance * 0.86,
            ],
        );
        controls.current?.target.fromArray(saved?.target ?? defaultTarget);
        controls.current?.update();
        if (resetVersion !== initialResetVersion.current && controls.current) {
            saveCamera.current({
                position: camera.position.toArray(),
                target: controls.current.target.toArray(),
            });
        }
    }, [camera, distance, resetVersion, size.width]);

    useEffect(() => {
        const control = controls.current;
        if (!control || !selectedId) return;
        const position = layout.positions.get(selectedId);
        if (!position) return;
        const target = new Vector3(...position).multiplyScalar(0.3);
        const tween = gsap.to(control.target, {
            x: target.x,
            y: target.y,
            z: target.z,
            duration: reducedMotion ? 0 : 0.35,
            onUpdate: () => control.update(),
        });
        return () => {
            tween.kill();
        };
    }, [selectedId, layout, reducedMotion]);

    useEffect(() => {
        if (!exitingId || reducedMotion) return;
        const position = layout.positions.get(exitingId);
        if (!position) return;
        const tween = gsap.to(camera.position, {
            x: position[0] * 0.7,
            y: camera.position.y * 0.8,
            z: camera.position.z * 0.75 + position[2] * 0.25,
            duration: 0.32,
            ease: 'power2.inOut',
            onUpdate: () => controls.current?.update(),
        });
        return () => {
            tween.kill();
        };
    }, [camera, exitingId, layout, reducedMotion]);

    return (
        <>
            <fog
                attach="fog"
                args={[
                    dark ? '#25262a' : '#dad9d6',
                    distance * 1.6,
                    distance * 4,
                ]}
            />
            <ambientLight intensity={dark ? 0.85 : 1.15} />
            <directionalLight
                position={[-7, 9, 7]}
                intensity={dark ? 3.1 : 3.8}
                color="#fff8ed"
            />
            <directionalLight
                position={[7, -3, -5]}
                intensity={dark ? 1.5 : 2.2}
                color="#c8d0d6"
            />
            {quality !== 'low' && (
                <pointLight
                    position={[2, 1, 5]}
                    intensity={dark ? 18 : 24}
                    color="#ffffff"
                />
            )}
            {nodes.length > 0 &&
                [
                    0,
                    ...(nodes.length > 8 ? [1] : []),
                    ...(nodes.length > 22 ? [2] : []),
                ].map((ring) => (
                    <mesh
                        key={ring}
                        rotation={[-Math.PI / 2, 0, 0]}
                        position={[0, -0.16, 0]}
                    >
                        <ringGeometry
                            args={[
                                3.6 + ring * 2.5 - 0.008,
                                3.6 + ring * 2.5 + 0.008,
                                128,
                            ]}
                        />
                        <meshBasicMaterial
                            color={dark ? '#f2f2f0' : '#73777b'}
                            transparent
                            opacity={dark ? 0.2 : 0.25}
                            depthWrite={false}
                        />
                    </mesh>
                ))}
            <OrbitObject
                node={center}
                central
                position={[0, 0, 0]}
                dark={dark}
                quality={quality}
                visualScale={objectScale}
                reducedMotion={reducedMotion}
                paused={paused}
            />
            {nodes.map((node, index) => (
                <OrbitObject
                    key={node.id}
                    node={node}
                    position={layout.positions.get(node.id)!}
                    dark={dark}
                    quality={quality}
                    visualScale={objectScale}
                    reducedMotion={reducedMotion}
                    paused={paused || !!exitingId}
                    selected={selectedId === node.id}
                    showLabel={
                        index <
                        (quality === 'low' ? 12 : quality === 'high' ? 36 : 24)
                    }
                    onSelect={() => onSelect(node.id)}
                    onOpen={() => onOpen(node)}
                />
            ))}
            <OrbitControls
                ref={controls}
                makeDefault
                enablePan={false}
                enableDamping={!reducedMotion}
                dampingFactor={0.12}
                minDistance={Math.max(5.8, distance * 0.68)}
                maxDistance={distance * 1.6}
                minPolarAngle={0.25}
                maxPolarAngle={Math.PI / 2.2}
                enabled={!paused && !exitingId}
                onEnd={() => {
                    if (!controls.current) return;
                    saveCamera.current({
                        position: camera.position.toArray(),
                        target: controls.current.target.toArray(),
                    });
                }}
            />
        </>
    );
}

class SceneBoundary extends Component<
    { children: ReactNode },
    { failed: boolean }
> {
    state = { failed: false };
    static getDerivedStateFromError() {
        return { failed: true };
    }
    render() {
        return this.state.failed ? <SceneUnavailable /> : this.props.children;
    }
}

function SceneUnavailable() {
    return (
        <div
            role="status"
            className="flex h-full items-center justify-center p-8 text-center text-sm text-muted-foreground"
        >
            3D is unavailable in this browser. Use the item list below,
            Navigator, or Search to continue.
        </div>
    );
}

export default function OrbitScene(props: Props) {
    const { resolvedAppearance } = useAppearance();
    const [contextLost, setContextLost] = useState(false);
    if (contextLost) return <SceneUnavailable />;
    return (
        <SceneBoundary>
            <Canvas
                key={props.quality}
                camera={{ position: [0, 10, 12], fov: 45 }}
                dpr={
                    props.quality === 'low'
                        ? 1
                        : props.quality === 'high'
                          ? [1, 2]
                          : [1, 1.5]
                }
                gl={{
                    alpha: true,
                    antialias: props.quality !== 'low',
                    powerPreference:
                        props.quality === 'low' ? 'low-power' : 'default',
                }}
                fallback={<SceneUnavailable />}
                onCreated={({ gl }) => {
                    gl.domElement.addEventListener(
                        'webglcontextlost',
                        (event) => {
                            event.preventDefault();
                            setContextLost(true);
                        },
                    );
                }}
            >
                <SceneContents
                    {...props}
                    dark={resolvedAppearance === 'dark'}
                />
            </Canvas>
        </SceneBoundary>
    );
}
