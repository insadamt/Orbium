import { gsap } from 'gsap';
import { flushSync } from 'react-dom';

type SurfaceSnapshot = {
    element: HTMLElement;
    left: number;
    top: number;
    width: number;
};
type SplitMotion = { anchor: SurfaceSnapshot | null; enteringId?: string };
let pendingMotion: SplitMotion | undefined;
let layoutAnimation: gsap.core.Timeline | undefined;
let exitAnimation: gsap.core.Tween | undefined;

function reduceMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function tabSurface(tabId: string): HTMLElement | null {
    const pane = Array.from(
        document.querySelectorAll<HTMLElement>('[data-workspace-tab-id]'),
    ).find((element) => element.dataset.workspaceTabId === tabId);
    return pane ?? null;
}

function captureSurface(tabId: string): SurfaceSnapshot | null {
    const element = tabSurface(tabId);
    if (!element) return null;
    const surface =
        element.querySelector<HTMLElement>('.floating-body-island') ?? element;
    const bounds = surface.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return null;
    return { element, left: bounds.left, top: bounds.top, width: bounds.width };
}

function popupTransformOrigin(element: HTMLElement) {
    const bounds = element.getBoundingClientRect();
    const visibleCenter = Math.min(
        bounds.height,
        Math.max(0, window.innerHeight / 2 - bounds.top),
    );
    return `50% ${visibleCenter}px`;
}

export function captureSplitMotion(anchorId: string, enteringId?: string) {
    layoutAnimation?.progress(1);
    layoutAnimation = undefined;
    pendingMotion = reduceMotion()
        ? undefined
        : { anchor: captureSurface(anchorId), enteringId };
}

export function playPendingSplitMotion() {
    const motion = pendingMotion;
    pendingMotion = undefined;
    if (!motion || reduceMotion()) return;
    const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
    const anchor = motion.anchor;
    if (anchor?.element.isConnected) {
        const surface =
            anchor.element.querySelector<HTMLElement>(
                '.floating-body-island',
            ) ?? anchor.element;
        const bounds = surface.getBoundingClientRect();
        if (bounds.width && bounds.height) {
            timeline.fromTo(
                anchor.element,
                {
                    x:
                        anchor.left +
                        anchor.width / 2 -
                        bounds.left -
                        bounds.width / 2,
                    y: Math.max(-64, Math.min(64, anchor.top - bounds.top)),
                    scaleX: anchor.width / bounds.width,
                    transformOrigin: '50% 0%',
                },
                {
                    x: 0,
                    y: 0,
                    scaleX: 1,
                    duration: 0.46,
                    clearProps: 'transform,transformOrigin',
                },
                0,
            );
        }
    }
    const entering = motion.enteringId ? tabSurface(motion.enteringId) : null;
    if (entering) {
        timeline.fromTo(
            entering,
            {
                scale: 0.94,
                y: 24,
                transformOrigin: popupTransformOrigin(entering),
            },
            {
                scale: 1,
                y: 0,
                duration: 0.38,
                clearProps: 'transform,transformOrigin',
            },
            0.06,
        );
    }
    layoutAnimation = timeline;
}

export function animateSplitExit({
    outgoingId,
    survivorId,
    commit,
}: {
    outgoingId: string;
    survivorId: string;
    commit: () => boolean;
}) {
    if (exitAnimation?.isActive()) return;
    layoutAnimation?.progress(1);
    const outgoing = tabSurface(outgoingId);
    if (reduceMotion() || !outgoing) {
        captureSplitMotion(survivorId);
        if (!commit()) pendingMotion = undefined;
        return;
    }
    const finish = () => {
        exitAnimation = undefined;
        captureSplitMotion(survivorId);
        let committed = false;
        flushSync(() => {
            committed = commit();
        });
        if (!committed) pendingMotion = undefined;
        gsap.set(outgoing, {
            clearProps: 'transform,transformOrigin,pointerEvents',
        });
    };
    exitAnimation = gsap.to(outgoing, {
        scale: 0.94,
        y: 18,
        transformOrigin: popupTransformOrigin(outgoing),
        pointerEvents: 'none',
        duration: 0.18,
        ease: 'power2.in',
        onComplete: finish,
        onInterrupt: () => {
            exitAnimation = undefined;
            gsap.set(outgoing, {
                clearProps: 'transform,transformOrigin,pointerEvents',
            });
        },
    });
}

export function disposeSplitMotion() {
    pendingMotion = undefined;
    layoutAnimation?.kill();
    layoutAnimation = undefined;
    exitAnimation?.kill();
    exitAnimation = undefined;
}
