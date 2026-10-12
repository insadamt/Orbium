import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { OrbingEntity, WorldPoint } from './orbing-layout';
import {
    persistOrbitalSeconds,
    readOrbitalSeconds,
} from './orbing-camera-storage';
import {
    collectOrbingElements,
    paintOrbingFrame,
    type ProjectionOptions,
} from './orbing-frame';

export function resolveOrbitPositions(
    entities: OrbingEntity[],
    seconds: number,
) {
    const positions = new Map<number, WorldPoint>();
    for (const entity of entities) {
        const parent =
            entity.node.parent_id === null
                ? undefined
                : positions.get(entity.node.parent_id);
        const angle = entity.orbitAngle + seconds * entity.orbitSpeed;
        positions.set(
            entity.node.id,
            parent
                ? {
                      x: parent.x + Math.cos(angle) * entity.childDistance,
                      y: parent.y + Math.sin(angle) * entity.childDistance,
                  }
                : entity,
        );
    }
    return positions;
}

type MotionOptions = Omit<ProjectionOptions, 'positions'> & {
    storageKey: string;
    enabled: boolean;
    paused: boolean;
};

export function useOrbingMotion(options: MotionOptions) {
    const [initialSeconds] = useState(() =>
        readOrbitalSeconds(options.storageKey),
    );
    const seconds = useRef(initialSeconds);
    const positions = useRef(
        resolveOrbitPositions(options.entities, initialSeconds),
    );
    const [reducedMotion, setReducedMotion] = useState(
        () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
    useEffect(() => {
        const key = options.storageKey;
        const flush = () => persistOrbitalSeconds(key, seconds.current);
        const flushWhenHidden = () => {
            if (document.hidden) flush();
        };
        window.addEventListener('pagehide', flush);
        document.addEventListener('visibilitychange', flushWhenHidden);
        return () => {
            flush();
            window.removeEventListener('pagehide', flush);
            document.removeEventListener('visibilitychange', flushWhenHidden);
        };
    }, [options.storageKey]);
    useLayoutEffect(() => {
        const viewport = options.viewportRef.current;
        if (!viewport) return;
        const elements = collectOrbingElements(viewport);
        const media = window.matchMedia('(prefers-reduced-motion: reduce)');
        let frame: number | undefined;
        let previousTime: number | undefined;
        let intersects = true;
        let modalOpen = false;
        function paint() {
            positions.current = resolveOrbitPositions(
                options.entities,
                seconds.current,
            );
            paintOrbingFrame(
                { ...options, positions: positions.current },
                elements,
            );
        }
        function animate(time: number) {
            if (previousTime !== undefined)
                seconds.current += Math.min(0.05, (time - previousTime) / 1000);
            previousTime = time;
            paint();
            frame = requestAnimationFrame(animate);
        }
        function syncPlayback() {
            if (frame !== undefined) cancelAnimationFrame(frame);
            frame = undefined;
            previousTime = undefined;
            setReducedMotion(media.matches);
            if (
                options.enabled &&
                !options.paused &&
                !media.matches &&
                !document.hidden &&
                intersects &&
                !modalOpen &&
                options.entities.some((entity) => entity.orbitSpeed !== 0)
            )
                frame = requestAnimationFrame(animate);
        }
        function detectModal() {
            const next = Boolean(
                document.querySelector(
                    '[role="dialog"]:not([data-state="closed"]), dialog[open], [role="menu"]:not([data-state="closed"])',
                ),
            );
            if (next === modalOpen) return;
            modalOpen = next;
            syncPlayback();
        }
        const visibility = new IntersectionObserver(([entry]) => {
            intersects = entry.isIntersecting;
            syncPlayback();
        });
        const modals = new MutationObserver(detectModal);
        visibility.observe(viewport);
        modals.observe(document.body, { childList: true, subtree: true });
        detectModal();
        paint();
        syncPlayback();
        media.addEventListener('change', syncPlayback);
        document.addEventListener('visibilitychange', syncPlayback);
        return () => {
            if (frame !== undefined) cancelAnimationFrame(frame);
            visibility.disconnect();
            modals.disconnect();
            media.removeEventListener('change', syncPlayback);
            document.removeEventListener('visibilitychange', syncPlayback);
        };
    }, [options]);
    return {
        reducedMotion,
        currentPosition: (entity: OrbingEntity) =>
            positions.current.get(entity.node.id) ?? entity,
    };
}
