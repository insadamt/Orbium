import { gsap } from 'gsap';
import { useLayoutEffect, useRef, type RefObject } from 'react';

type CardSnapshot = {
    element: HTMLElement;
    left: number;
    top: number;
    width: number;
    height: number;
    background: string;
    outline: string;
};

export function useExplorerLayoutMotion(
    container: RefObject<HTMLElement | null>,
    enabled = true,
) {
    const previousCards = useRef<Map<number, CardSnapshot> | null>(null);
    const animatedCards = useRef(new Set<HTMLElement>());
    const exitCards = useRef(new Set<HTMLElement>());

    function stopCardMotion(element: HTMLElement) {
        gsap.killTweensOf(element);
        gsap.set(element, { clearProps: 'transform,opacity' });
        delete element.dataset.layoutAnimating;
        animatedCards.current.delete(element);
    }

    useLayoutEffect(
        () => () => {
            for (const element of animatedCards.current)
                stopCardMotion(element);
            for (const element of exitCards.current) {
                gsap.killTweensOf(element);
                element.remove();
            }
        },
        [],
    );

    useLayoutEffect(() => {
        if (!enabled || !container.current) {
            previousCards.current = null;
            return;
        }
        const currentCards = new Map<number, CardSnapshot>();
        const containerBounds = container.current.getBoundingClientRect();
        for (const element of container.current.querySelectorAll<HTMLElement>(
            '[data-node-id]',
        )) {
            if (
                element.dataset.dragging === 'true' ||
                element.getClientRects().length === 0
            )
                continue;
            const bounds = element.getBoundingClientRect();
            const appearance = getComputedStyle(element);
            const animated = animatedCards.current.has(element);
            currentCards.set(Number(element.dataset.nodeId), {
                element,
                left:
                    bounds.left -
                    containerBounds.left -
                    (animated ? Number(gsap.getProperty(element, 'x')) : 0),
                top:
                    bounds.top -
                    containerBounds.top -
                    (animated ? Number(gsap.getProperty(element, 'y')) : 0),
                width: bounds.width,
                height: bounds.height,
                background: appearance.backgroundColor,
                outline: appearance.outline,
            });
        }
        const previous = previousCards.current;
        previousCards.current = currentCards;
        if (!previous) return;
        const changed =
            previous.size !== currentCards.size ||
            [...currentCards].some(([id, current]) => {
                const old = previous.get(id);
                return (
                    !old ||
                    Math.abs(old.left - current.left) > 0.5 ||
                    Math.abs(old.top - current.top) > 0.5 ||
                    old.element !== current.element
                );
            });
        if (!changed) return;
        const reducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;
        for (const [id, current] of currentCards) {
            const old = previous.get(id);
            const oldX =
                old && animatedCards.current.has(old.element)
                    ? Number(gsap.getProperty(old.element, 'x'))
                    : 0;
            const oldY =
                old && animatedCards.current.has(old.element)
                    ? Number(gsap.getProperty(old.element, 'y'))
                    : 0;
            stopCardMotion(current.element);
            if (reducedMotion || current.element.dataset.stackSource === 'true')
                continue;
            const x = old ? old.left + oldX - current.left : 0;
            const y = old ? old.top + oldY - current.top : 0;
            if (old && Math.abs(x) < 0.5 && Math.abs(y) < 0.5) continue;
            current.element.dataset.layoutAnimating = 'true';
            animatedCards.current.add(current.element);
            gsap.fromTo(
                current.element,
                { x, y, opacity: old ? 1 : 0 },
                {
                    x: 0,
                    y: 0,
                    opacity: 1,
                    duration: 0.42,
                    ease: 'power2.inOut',
                    onComplete: () => stopCardMotion(current.element),
                },
            );
        }
        if (reducedMotion) return;
        for (const [id, old] of previous) {
            if (currentCards.has(id) || old.element.isConnected) continue;
            const oldX = animatedCards.current.has(old.element)
                ? Number(gsap.getProperty(old.element, 'x'))
                : 0;
            const oldY = animatedCards.current.has(old.element)
                ? Number(gsap.getProperty(old.element, 'y'))
                : 0;
            const exit = old.element.cloneNode(true) as HTMLElement;
            exit.classList.add('floating-layout-exit');
            exit.removeAttribute('data-node-id');
            exit.removeAttribute('data-layout-animating');
            exit.removeAttribute('role');
            exit.removeAttribute('tabindex');
            exit.setAttribute('aria-hidden', 'true');
            exit.querySelectorAll('button').forEach((button) => {
                button.disabled = true;
                button.tabIndex = -1;
            });
            document.body.appendChild(exit);
            exitCards.current.add(exit);
            gsap.set(exit, {
                x: 0,
                y: 0,
                left: containerBounds.left + old.left + oldX,
                top: containerBounds.top + old.top + oldY,
                width: old.width,
                height: old.height,
                minHeight: 0,
                maxWidth: 'none',
                backgroundColor: old.background,
                outline: old.outline,
                opacity: 1,
            });
            gsap.to(exit, {
                opacity: 0,
                scale: 0.92,
                y: -8,
                duration: 0.22,
                ease: 'power2.in',
                onComplete: () => {
                    exit.remove();
                    exitCards.current.delete(exit);
                },
            });
            stopCardMotion(old.element);
        }
    });
}
