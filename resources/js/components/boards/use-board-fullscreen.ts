import { gsap } from 'gsap';
import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import './board-fullscreen.css';

export function useBoardFullscreen(pageRef: RefObject<HTMLDivElement | null>) {
    const [fullscreen, setFullscreen] = useState(false);
    const toggleRef = useRef<() => void>(() => {});

    useLayoutEffect(() => {
        const page = pageRef.current;
        if (!page) return;
        const reducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        );
        let expanded = false;
        let placeholder: HTMLDivElement | undefined;
        let animation: gsap.core.Tween | undefined;
        let restoreShell: (() => void) | undefined;
        const heading = page.querySelector<HTMLElement>('.board-page-heading');
        const updateHeadingHeight = () => {
            page.style.setProperty(
                '--board-fullscreen-heading-height',
                `${heading?.offsetHeight ?? 0}px`,
            );
        };
        const headingObserver = new ResizeObserver(updateHeadingHeight);
        if (heading) headingObserver.observe(heading);
        const originalStyles = new Map<string, string>();
        const styleProperties = [
            'position',
            'top',
            'left',
            'width',
            'height',
            'min-height',
            'margin',
            'z-index',
            'border-radius',
            'animation',
        ];

        function restorePage() {
            for (const [property, value] of originalStyles) {
                if (value) page!.style.setProperty(property, value);
                else page!.style.removeProperty(property);
            }
            originalStyles.clear();
            delete page!.dataset.fullscreen;
            placeholder?.remove();
            placeholder = undefined;
            page!.dispatchEvent(new Event('board-viewport-restored'));
            page!.style.removeProperty('--board-fullscreen-progress');
            restoreShell?.();
            restoreShell = undefined;
        }

        function animateBounds() {
            if (!placeholder) return;
            animation?.kill();
            const bounds = placeholder.getBoundingClientRect();
            const viewport = window.visualViewport;
            const target = expanded
                ? {
                      top: viewport?.offsetTop ?? 0,
                      left: viewport?.offsetLeft ?? 0,
                      width: viewport?.width ?? window.innerWidth,
                      height: viewport?.height ?? window.innerHeight,
                      borderRadius: 0,
                  }
                : {
                      top: bounds.top,
                      left: bounds.left,
                      width: bounds.width,
                      height: Math.max(
                          280,
                          (viewport?.height ?? window.innerHeight) -
                              bounds.top -
                              16,
                      ),
                      borderRadius: getComputedStyle(placeholder).borderRadius,
                  };
            animation = gsap.to(page, {
                ...target,
                '--board-fullscreen-progress': expanded ? 1 : 0,
                duration: reducedMotion.matches ? 0 : expanded ? 0.32 : 0.26,
                ease: 'power3.inOut',
                onComplete: () => {
                    if (!expanded) restorePage();
                },
            });
        }

        function enterFullscreen() {
            if (!placeholder) {
                const bounds = page!.getBoundingClientRect();
                const computed = getComputedStyle(page!);
                for (const property of styleProperties)
                    originalStyles.set(
                        property,
                        page!.style.getPropertyValue(property),
                    );
                placeholder = document.createElement('div');
                Object.assign(placeholder.style, {
                    height: `${bounds.height}px`,
                    margin: computed.margin,
                    borderRadius: computed.borderRadius,
                });
                placeholder.setAttribute('aria-hidden', 'true');
                page!.before(placeholder);
                updateHeadingHeight();
                page!.style.setProperty('--board-fullscreen-progress', '0');
                Object.assign(page!.style, {
                    position: 'fixed',
                    top: `${bounds.top}px`,
                    left: `${bounds.left}px`,
                    width: `${bounds.width}px`,
                    height: `${bounds.height}px`,
                    minHeight: '0',
                    margin: '0',
                    zIndex: '30',
                    animation: 'none',
                });
                page!.dataset.fullscreen = 'true';
                //
                // Restoring animation:none would replay the page's arrival fade and briefly hide the entire Board on exit.
                //
                page!.dataset.fullscreenVisited = 'true';

                //
                // Keep editors in place; moving them into a fullscreen portal would discard their live selection and drafts.
                //
                const siblings: Array<{
                    element: HTMLElement;
                    inert: boolean;
                }> = [];
                let ancestor: HTMLElement = page!;
                while (
                    ancestor.parentElement &&
                    ancestor.parentElement !== document.body
                ) {
                    for (const sibling of ancestor.parentElement.children) {
                        if (
                            sibling === ancestor ||
                            !(sibling instanceof HTMLElement)
                        )
                            continue;
                        siblings.push({
                            element: sibling,
                            inert: sibling.inert,
                        });
                        sibling.inert = true;
                    }
                    ancestor = ancestor.parentElement;
                }
                const previousOverflow = document.body.style.overflow;
                const previousScrollbarGutter =
                    document.documentElement.style.scrollbarGutter;
                document.documentElement.style.scrollbarGutter = 'stable';
                document.body.style.overflow = 'hidden';
                restoreShell = () => {
                    siblings.forEach(({ element, inert }) => {
                        element.inert = inert;
                    });
                    document.body.style.overflow = previousOverflow;
                    document.documentElement.style.scrollbarGutter =
                        previousScrollbarGutter;
                };
            }
            animateBounds();
        }

        toggleRef.current = () => {
            expanded = !expanded;
            setFullscreen(expanded);
            if (expanded) enterFullscreen();
            else animateBounds();
        };
        const dismissFullscreen = (event: KeyboardEvent) => {
            if (
                !expanded ||
                event.key !== 'Escape' ||
                event.defaultPrevented ||
                event.isComposing ||
                document.fullscreenElement
            )
                return;
            const target = event.target;
            if (!(target instanceof Element) || !page.contains(target)) return;
            if (
                target.closest(
                    '[role="dialog"], [role="menu"], [role="listbox"], input, textarea, select, [contenteditable="true"]',
                ) ||
                page.querySelector(
                    '.board-workspace[data-editing="true"], .board-canvas[data-placing="true"], .board-canvas[data-gesture]:not([data-gesture=""])',
                )
            )
                return;
            event.preventDefault();
            toggleRef.current();
        };
        const resizeFullscreen = () => {
            if (placeholder) animateBounds();
        };
        const finishReducedMotion = () => {
            if (reducedMotion.matches) animation?.progress(1);
        };
        document.addEventListener('keydown', dismissFullscreen);
        window.addEventListener('resize', resizeFullscreen);
        window.visualViewport?.addEventListener('resize', resizeFullscreen);
        window.visualViewport?.addEventListener('scroll', resizeFullscreen);
        reducedMotion.addEventListener('change', finishReducedMotion);
        return () => {
            animation?.kill();
            headingObserver.disconnect();
            if (placeholder) restorePage();
            page.style.removeProperty('--board-fullscreen-heading-height');
            toggleRef.current = () => {};
            document.removeEventListener('keydown', dismissFullscreen);
            window.removeEventListener('resize', resizeFullscreen);
            window.visualViewport?.removeEventListener(
                'resize',
                resizeFullscreen,
            );
            window.visualViewport?.removeEventListener(
                'scroll',
                resizeFullscreen,
            );
            reducedMotion.removeEventListener('change', finishReducedMotion);
        };
    }, [pageRef]);

    return { fullscreen, toggleFullscreen: () => toggleRef.current() };
}
