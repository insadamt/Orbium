import { animateTrashAmbient } from './trash-ambient-motion';
import { gsap } from 'gsap';
import { Trash2 } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type Props = {
    workspaceId: number;
    visible: boolean;
    active: boolean;
    count: number;
    busy?: boolean;
};

export function ExplorerTrashDropTarget({
    workspaceId,
    visible,
    active,
    count,
    busy,
}: Props) {
    const [displayCount, setDisplayCount] = useState(count);
    const [mounted, setMounted] = useState(visible);
    const target = useRef<HTMLDivElement>(null);
    const ambient = useRef<HTMLDivElement>(null);
    const entryMotion = useRef<gsap.core.Tween | null>(null);
    useEffect(() => {
        if (visible) setMounted(true);
    }, [visible]);
    useEffect(() => {
        if (visible && count > 0) setDisplayCount(count);
    }, [visible, count]);
    useLayoutEffect(() => {
        if (!target.current) return;
        const reducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;
        entryMotion.current?.kill();
        if (visible) {
            entryMotion.current = gsap.fromTo(
                target.current,
                { opacity: 0 },
                {
                    opacity: 1,
                    duration: reducedMotion ? 0 : 0.3,
                    ease: 'power3.out',
                },
            );
        } else {
            entryMotion.current = gsap.to(target.current, {
                opacity: 0,
                duration: reducedMotion ? 0 : 0.22,
                ease: 'power2.in',
                onComplete: () => setMounted(false),
            });
        }
        return () => {
            entryMotion.current?.kill();
        };
    }, [visible, mounted]);
    useLayoutEffect(() => {
        if (!ambient.current) return;
        return animateTrashAmbient(ambient.current, active);
    }, [active, mounted]);
    if (!mounted) return null;
    return createPortal(
        <div className="explorer-trash-drop-anchor">
            <div
                ref={target}
                className="explorer-trash-drop-target"
                data-explorer-trash-target
                data-workspace-id={workspaceId}
                data-visible={visible}
                data-active={active}
                role="status"
            >
                <div
                    ref={ambient}
                    className="explorer-trash-drop-ambient"
                    aria-hidden="true"
                >
                    <span className="explorer-trash-glow-layer explorer-trash-glow-core" />
                    <span className="explorer-trash-glow-layer explorer-trash-glow-left" />
                    <span className="explorer-trash-glow-layer explorer-trash-glow-right" />
                </div>
                <div className="explorer-trash-drop-label">
                    <Trash2 size={23} aria-hidden="true" />
                    <span>
                        {busy
                            ? 'Moving to Trash…'
                            : active
                              ? 'Release to move to Trash'
                              : 'Drop here to delete'}
                    </span>
                    <span className="explorer-trash-drop-count">
                        {displayCount} {displayCount === 1 ? 'item' : 'items'}
                    </span>
                </div>
            </div>
        </div>,
        document.body,
    );
}
