// Animates accepted explorer layout changes while leaving drag gesture motion alone.
// Depends on GSAP, card data attributes and the OS reduced-motion preference.
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

    useLayoutEffect(() => {
        const reducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        );
        function stopAllMotion() {
            for (const element of animatedCards.current)
                stopCardMotion(element);
            for (const element of exitCards.current) {
                gsap.killTweensOf(element);
                element.remove();
            }
            exitCards.current.clear();
        }
        function updateMotionPreference() {
            if (reducedMotion.matches) stopAllMotion();
        }
        reducedMotion.addEventListener('change', updateMotionPreference);
        return () => {
            reducedMotion.removeEventListener('change', updateMotionPreference);
            stopAllMotion();
        };
    }, []);

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
        const firstLayout = previousCards.current === null;
        const previous =
            previousCards.current ?? new Map<number, CardSnapshot>();
        previousCards.current = currentCards;
        // Rapid filtering can bring a card back before its previous exit has finished.
        for (const exit of exitCards.current) {
            if (!currentCards.has(Number(exit.dataset.explorerExitId)))
                continue;
            gsap.killTweensOf(exit);
            exit.remove();
            exitCards.current.delete(exit);
        }
        const changed =
            previous.size !== currentCards.size ||
            [...currentCards].some(([id, current]) => {
                const old = previous.get(id);
                return (
                    !old ||
                    Math.abs(old.left - current.left) > 0.5 ||
                    Math.abs(old.top - current.top) > 0.5 ||
                    Math.abs(old.width - current.width) > 0.5 ||
                    Math.abs(old.height - current.height) > 0.5 ||
                    old.element !== current.element
                );
            });
        if (!changed) return;
        const reducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;
        let entranceIndex = 0;
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
            const viewportTop = containerBounds.top + current.top;
            if (
                firstLayout &&
                (viewportTop > window.innerHeight ||
                    viewportTop + current.height < 0)
            )
                continue;
            const x = old ? old.left + oldX - current.left : 0;
            const y = old ? old.top + oldY - current.top : 10;
            const sizeChanged =
                old &&
                (Math.abs(old.width - current.width) > 0.5 ||
                    Math.abs(old.height - current.height) > 0.5);
            if (old && !sizeChanged && Math.abs(x) < 0.5 && Math.abs(y) < 0.5)
                continue;
            current.element.dataset.layoutAnimating = 'true';
            animatedCards.current.add(current.element);
            gsap.fromTo(
                current.element,
                { x, y, opacity: old ? (sizeChanged ? 0.75 : 1) : 0 },
                {
                    x: 0,
                    y: 0,
                    opacity: 1,
                    duration: old ? 0.42 : 0.28,
                    delay: firstLayout
                        ? Math.min(entranceIndex++, 8) * 0.02
                        : 0,
                    ease: old ? 'power2.inOut' : 'power2.out',
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
            const exitTop = containerBounds.top + old.top + oldY;
            if (exitTop > window.innerHeight || exitTop + old.height < 0) {
                stopCardMotion(old.element);
                continue;
            }
            const exit = old.element.cloneNode(true) as HTMLElement;
            exit.classList.add('floating-layout-exit');
            exit.removeAttribute('data-node-id');
            exit.removeAttribute('data-layout-animating');
            exit.removeAttribute('role');
            exit.removeAttribute('tabindex');
            exit.setAttribute('aria-hidden', 'true');
            exit.inert = true;
            exit.dataset.explorerExitId = String(id);
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
