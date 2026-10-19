import { useLayoutEffect, useRef } from 'react';
import { mountMenuHighlight } from '@/lib/menu-highlight';
import { mountToolbarReveal } from './toolbar-reveal';

export function mountToolbarHighlight(
    surface: HTMLElement,
    mountReveal = mountToolbarReveal,
) {
    const destroyReveal = mountReveal(surface);
    const destroyHighlight = mountMenuHighlight(surface, {
        itemSelector: '.editor-toolbar-button',
        keepHighlightBetweenItems: true,
        selectedSelector: ':focus-visible',
    });
    function navigateVerticalToolbar(event: KeyboardEvent) {
        if (
            surface.getAttribute('aria-orientation') !== 'vertical' ||
            !['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)
        )
            return;
        const controls = Array.from(
            surface.querySelectorAll<HTMLElement>('.editor-toolbar-button'),
        ).filter(
            (control) => !control.matches(':disabled, [aria-disabled="true"]'),
        );
        const index = controls.indexOf(
            surface.ownerDocument.activeElement as HTMLElement,
        );
        if (index < 0) return;
        const nextIndex =
            event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? controls.length - 1
                  : (index +
                        (event.key === 'ArrowDown' ? 1 : -1) +
                        controls.length) %
                    controls.length;
        event.preventDefault();
        event.stopPropagation();
        controls[nextIndex]?.focus({ preventScroll: true });
    }
    surface.addEventListener('keydown', navigateVerticalToolbar);
    return () => {
        surface.removeEventListener('keydown', navigateVerticalToolbar);
        destroyReveal();
        destroyHighlight();
    };
}

export function ToolbarHighlight({
    mountReveal = mountToolbarReveal,
}: {
    mountReveal?: typeof mountToolbarReveal;
}) {
    const marker = useRef<HTMLSpanElement>(null);
    useLayoutEffect(() => {
        const surface = marker.current?.parentElement;
        if (surface) return mountToolbarHighlight(surface, mountReveal);
    }, [mountReveal]);
    return <span ref={marker} hidden aria-hidden="true" />;
}
