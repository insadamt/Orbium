import { outlineScrollOwner } from './outline-navigation-motion';

export function outlineReadingTop(editor: HTMLElement): number {
    const owner = outlineScrollOwner(editor);
    const viewport = owner.ownerDocument.defaultView ?? window;
    const controls = viewport.document
        .querySelector('.floating-top-controls')
        ?.getBoundingClientRect();
    const paneTop =
        owner === owner.ownerDocument.scrollingElement
            ? 0
            : owner.getBoundingClientRect().top;
    const frame = window.frameElement as HTMLElement | null;
    const frameTop =
        frame && owner.ownerDocument !== editor.ownerDocument
            ? frame.getBoundingClientRect().top
            : 0;
    return Math.max(controls?.bottom ?? 96, paneTop) + 16 - frameTop;
}

export function subscribeOutlineScrolling(
    editor: HTMLElement,
    refresh: () => void,
): () => void {
    const documentViewport = editor.ownerDocument.defaultView ?? window;
    const frameElement = documentViewport.frameElement;
    const viewport =
        frameElement?.ownerDocument.defaultView ?? documentViewport;
    const viewports = new Set([documentViewport, viewport]);
    let frame = 0;
    const schedule = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(refresh);
    };
    // Retained editors change scroll owners when splitting without remounting their outlines.

    const scheduleOwnerScroll = (event: Event) => {
        const owner = outlineScrollOwner(editor);
        if (event.target === owner || event.target === owner.ownerDocument)
            schedule();
    };
    viewports.forEach((host) =>
        host.addEventListener('scroll', scheduleOwnerScroll, {
            passive: true,
            capture: true,
        }),
    );
    viewport.addEventListener('resize', schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(editor);
    return () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        viewports.forEach((host) =>
            host.removeEventListener('scroll', scheduleOwnerScroll, true),
        );
        viewport.removeEventListener('resize', schedule);
    };
}
