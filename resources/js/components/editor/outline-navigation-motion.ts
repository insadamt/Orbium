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

export function headingScrollDestination(
    editorElement: HTMLElement,
    headingTop: number,
) {
    const owner = outlineScrollOwner(editorElement);
    const frame = window.frameElement as HTMLElement | null;
    const frameTop =
        frame && owner.ownerDocument !== editorElement.ownerDocument
            ? frame.getBoundingClientRect().top
            : 0;
    const ownerTop =
        owner === owner.ownerDocument.scrollingElement
            ? 0
            : owner.getBoundingClientRect().top;
    return owner.scrollTop + frameTop + headingTop - ownerTop - 96;
}

type HeadingNavigation = {
    editorElement: HTMLElement;
    measureDestination: (navigate: (destination: number) => void) => void;
};

export function animateHeadingNavigation(
    request: HeadingNavigation,
): () => void {
    const owner = outlineScrollOwner(request.editorElement);
    let tween: gsap.core.Tween | undefined;
    let cancelled = false;
    const cancel = () => {
        cancelled = true;
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
        owner === owner.ownerDocument.scrollingElement
            ? owner.ownerDocument.defaultView!
            : owner;
    const removeInterruptions = () => {
        eventHost.removeEventListener('wheel', interrupt);
        eventHost.removeEventListener('touchstart', interrupt);
        eventHost.removeEventListener('pointerdown', interrupt);
        window.removeEventListener('keydown', interrupt);
    };
    eventHost.addEventListener('wheel', interrupt, { passive: true });
    eventHost.addEventListener('touchstart', interrupt, { passive: true });
    eventHost.addEventListener('pointerdown', interrupt, { passive: true });
    window.addEventListener('keydown', interrupt);
    request.measureDestination((destination) => {
        if (cancelled) return;
        const boundedDestination = Math.max(
            0,
            Math.min(destination, owner.scrollHeight - owner.clientHeight),
        );
        if (prefersReducedOutlineMotion()) {
            owner.scrollTop = boundedDestination;
            removeInterruptions();
            return;
        }
        tween = gsap.to(owner, {
            scrollTop: boundedDestination,
            duration: Math.min(
                0.85,
                0.35 + Math.abs(boundedDestination - owner.scrollTop) / 5000,
            ),
            ease: 'power3.inOut',
            onComplete: removeInterruptions,
        });
    });
    return cancel;
}
