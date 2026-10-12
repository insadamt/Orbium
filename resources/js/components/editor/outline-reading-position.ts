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
    const owner = outlineScrollOwner(editor);
    const viewport = owner.ownerDocument.defaultView ?? window;
    const scrollHost: EventTarget =
        owner === owner.ownerDocument.scrollingElement ? viewport : owner;
    let frame = 0;
    const schedule = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(refresh);
    };
    scrollHost.addEventListener('scroll', schedule, { passive: true });
    viewport.addEventListener('resize', schedule);
    return () => {
        cancelAnimationFrame(frame);
        scrollHost.removeEventListener('scroll', schedule);
        viewport.removeEventListener('resize', schedule);
    };
}
