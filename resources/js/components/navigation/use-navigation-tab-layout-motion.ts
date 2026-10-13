import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';

type TabPosition = { left: number };

function measureTabPosition(element: HTMLElement) {
    const bounds = element.getBoundingClientRect();
    const translation = parseFloat(getComputedStyle(element).translate) || 0;
    // Entry/exit scale must not change the measured layout position.
    const left = bounds.left + (bounds.width - element.offsetWidth) / 2;
    return { element, left: left - translation, translation };
}

export function useNavigationTabLayoutMotion(
    tabListRef: RefObject<HTMLDivElement | null>,
    dragging: boolean,
) {
    const previousPositions = useRef(new Map<string, TabPosition>());
    const animations = useRef(new Map<HTMLElement, Animation>());
    const previousScrollLeft = useRef(0);
    const previousViewportWidth = useRef(0);
    const previouslyDragging = useRef(false);

    useLayoutEffect(() => {
        const tabList = tabListRef.current;
        if (!tabList) return;
        const positions = Array.from(tabList.children)
            .filter(
                (element): element is HTMLElement =>
                    element instanceof HTMLElement,
            )
            .map((element) => ({
                key: element.dataset.tabMotionKey,
                ...measureTabPosition(element),
            }));
        const skipMotion =
            dragging ||
            previouslyDragging.current ||
            window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
            previousViewportWidth.current !== window.innerWidth;

        for (const { key, element, left, translation } of positions) {
            if (!key) continue;
            const previous = previousPositions.current.get(key);
            animations.current.get(element)?.cancel();
            animations.current.delete(element);
            if (
                skipMotion ||
                !previous ||
                element.dataset.tabExiting === 'true'
            )
                continue;
            const offset = previous.left + translation - left;
            if (Math.abs(offset) < 0.5) continue;
            const animation = element.animate(
                [{ translate: `${offset}px 0` }, { translate: '0px 0' }],
                { duration: 240, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
            );
            animations.current.set(element, animation);
            animation.onfinish = () => animations.current.delete(element);
        }
        for (const [element, animation] of animations.current) {
            if (!tabList.contains(element)) {
                animation.cancel();
                animations.current.delete(element);
            }
        }
        previousPositions.current = new Map(
            positions.flatMap(({ key, left }) =>
                key ? [[key, { left }] as const] : [],
            ),
        );
        previousScrollLeft.current = tabList.scrollLeft;
        previousViewportWidth.current = window.innerWidth;
        previouslyDragging.current = dragging;
    });

    useEffect(() => {
        const tabList = tabListRef.current;
        if (!tabList) return;
        const runningAnimations = animations.current;
        const reducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        );
        function updateScrollPositions() {
            if (!tabList) return;
            const scrollDelta = tabList.scrollLeft - previousScrollLeft.current;
            for (const position of previousPositions.current.values())
                position.left -= scrollDelta;
            previousScrollLeft.current = tabList.scrollLeft;
        }
        function cancelLayoutAnimations() {
            for (const animation of runningAnimations.values())
                animation.cancel();
            runningAnimations.clear();
        }
        tabList.addEventListener('scroll', updateScrollPositions, {
            passive: true,
        });
        reducedMotion.addEventListener('change', cancelLayoutAnimations);
        return () => {
            tabList.removeEventListener('scroll', updateScrollPositions);
            reducedMotion.removeEventListener('change', cancelLayoutAnimations);
            cancelLayoutAnimations();
        };
    }, [tabListRef]);
}
