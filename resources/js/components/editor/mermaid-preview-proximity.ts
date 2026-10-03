import { useEffect, useRef, useState } from 'react';

export type PreviewPriority = { visible: boolean; distance: number };

function findScrollContainer(element: HTMLElement): HTMLElement | null {
    for (
        let parent = element.parentElement;
        parent;
        parent = parent.parentElement
    ) {
        if (/auto|scroll/.test(window.getComputedStyle(parent).overflowY)) {
            return parent;
        }
    }
    return null;
}

function getViewportBounds(scrollContainer: HTMLElement | null) {
    const containerBounds = scrollContainer?.getBoundingClientRect();
    return {
        top: Math.max(0, containerBounds?.top ?? 0),
        bottom: Math.min(
            window.innerHeight,
            containerBounds?.bottom ?? window.innerHeight,
        ),
        left: Math.max(0, containerBounds?.left ?? 0),
        right: Math.min(
            window.innerWidth,
            containerBounds?.right ?? window.innerWidth,
        ),
    };
}

function getPreparationMargin(scrollContainer: HTMLElement | null) {
    return Math.max(
        600,
        Math.ceil((scrollContainer?.clientHeight ?? window.innerHeight) * 1.5),
    );
}

export function getMermaidPreviewPriority(
    element: HTMLElement | null,
): PreviewPriority | null {
    if (!element) return null;
    const scrollContainer = findScrollContainer(element);
    const viewport = getViewportBounds(scrollContainer);
    if (viewport.bottom <= viewport.top || viewport.right <= viewport.left)
        return null;

    const bounds = element.getBoundingClientRect();
    if (bounds.right <= viewport.left || bounds.left >= viewport.right)
        return null;

    const distance = Math.max(
        viewport.top - bounds.bottom,
        bounds.top - viewport.bottom,
        0,
    );
    if (distance > getPreparationMargin(scrollContainer)) return null;

    return distance === 0
        ? {
              visible: true,
              distance: Math.abs(
                  (bounds.top +
                      bounds.bottom -
                      viewport.top -
                      viewport.bottom) /
                      2,
              ),
          }
        : { visible: false, distance };
}

export function useMermaidPreviewActivation() {
    const previewContainer = useRef<HTMLDivElement>(null);
    const [activated, setActivated] = useState(false);

    useEffect(() => {
        if (activated) return;
        const container = previewContainer.current;
        if (!container || typeof IntersectionObserver === 'undefined') {
            setActivated(true);
            return;
        }

        const scrollContainer = findScrollContainer(container);
        const margin = getPreparationMargin(scrollContainer);
        const observer = new IntersectionObserver(
            (entries) => {
                if (!entries.some((entry) => entry.isIntersecting)) return;
                setActivated(true);
                observer.disconnect();
            },
            { root: scrollContainer, rootMargin: `${margin}px 0px` },
        );
        observer.observe(container);
        return () => observer.disconnect();
    }, [activated]);

    return { previewContainer, activated };
}
