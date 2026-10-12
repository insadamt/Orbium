import { gsap } from 'gsap';

export function prefersReducedOutlineMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function outlineScrollOwner(element: HTMLElement): HTMLElement {
    return (
        element.closest<HTMLElement>('[data-split-pane-id]') ??
        (window.frameElement as HTMLElement | null)?.closest<HTMLElement>(
            '[data-split-pane-id]',
        ) ??
        (element.ownerDocument.scrollingElement as HTMLElement)
    );
}

export function scrollOutlineTargetIntoView(target: HTMLElement) {
    const owner = outlineScrollOwner(target);
    const frame = window.frameElement as HTMLElement | null;
    const frameTop =
        frame && owner.ownerDocument !== target.ownerDocument
            ? frame.getBoundingClientRect().top
            : 0;
    const ownerTop =
        owner === target.ownerDocument.scrollingElement
            ? 0
            : owner.getBoundingClientRect().top;
    owner.scrollTop +=
        frameTop + target.getBoundingClientRect().top - ownerTop - 96;
}

type HeadingNavigation = {
    editorElement: HTMLElement;
    revealHeading: () => void;
};

export function animateHeadingNavigation(
    request: HeadingNavigation,
): () => void {
    const owner = outlineScrollOwner(request.editorElement);
    const start = owner.scrollTop;
    let frame = 0;
    let tween: gsap.core.Tween | undefined;
    let cancelled = false;
    const cancel = () => {
        cancelled = true;
        cancelAnimationFrame(frame);
        tween?.kill();
        removeInterruptions();
    };
    const interrupt = (event: Event) => {
        if (
            event instanceof KeyboardEvent &&
            ![
                'ArrowUp',
                'ArrowDown',
                'PageUp',
                'PageDown',
                'Home',
                'End',
                ' ',
            ].includes(event.key)
        )
            return;
        cancel();
    };
    const eventHost: EventTarget =
        owner === document.scrollingElement ? window : owner;
    const removeInterruptions = () => {
        eventHost.removeEventListener('wheel', interrupt);
        eventHost.removeEventListener('touchstart', interrupt);
        eventHost.removeEventListener('pointerdown', interrupt);
        window.removeEventListener('keydown', interrupt);
    };
    request.revealHeading();
    if (prefersReducedOutlineMotion()) return cancel;
    eventHost.addEventListener('wheel', interrupt, { passive: true });
    eventHost.addEventListener('touchstart', interrupt, { passive: true });
    eventHost.addEventListener('pointerdown', interrupt, { passive: true });
    window.addEventListener('keydown', interrupt);
    // Let CodeMirror render and measure an offscreen destination before animating.
    frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
            if (cancelled) return;
            const destination = owner.scrollTop;
            owner.scrollTop = start;
            tween = gsap.to(owner, {
                scrollTop: destination,
                duration: Math.min(
                    0.85,
                    0.35 + Math.abs(destination - start) / 5000,
                ),
                ease: 'power3.inOut',
                onComplete: removeInterruptions,
            });
        });
    });
    return cancel;
}
