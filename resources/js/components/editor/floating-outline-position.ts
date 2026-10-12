export function attachFloatingOutlinePositioning(
    host: HTMLElement,
    container: HTMLElement,
) {
    const frame = window.frameElement as HTMLElement | null;
    const pane =
        container.closest<HTMLElement>('[data-split-pane-id]') ??
        frame?.closest<HTMLElement>('[data-split-pane-id]');
    const viewport = pane?.ownerDocument.defaultView ?? window;
    const controls = viewport.document.querySelector('.floating-top-controls');
    const positionRail = () => {
        const paneBounds = pane?.getBoundingClientRect();
        const documentBounds = container.getBoundingClientRect();
        const frameBounds = frame?.getBoundingClientRect();
        const embedded = pane && pane.ownerDocument !== host.ownerDocument;
        const frameTop = embedded ? (frameBounds?.top ?? 0) : 0;
        const documentTop = documentBounds.top + frameTop;
        const documentBottom = documentBounds.bottom + frameTop;
        const headerBottom = controls?.getBoundingClientRect().bottom ?? 80;
        const visibleTop = Math.max(
            headerBottom + 24,
            paneBounds?.top ?? 0,
            documentTop,
        );
        const visibleBottom = Math.min(
            viewport.innerHeight - 24,
            paneBounds?.bottom ?? viewport.innerHeight,
            documentBottom,
        );
        const availableHeight = Math.max(0, visibleBottom - visibleTop);
        host.style.top = `${Math.max(0, visibleTop - documentTop)}px`;
        host.style.height = `${availableHeight}px`;
        host.style.visibility = availableHeight > 0 ? 'visible' : 'hidden';
        host.style.setProperty(
            '--outline-available-height',
            `${availableHeight}px`,
        );
        host.style.setProperty(
            '--outline-panel-width',
            `${Math.max(0, Math.min(260, documentBounds.width - 44))}px`,
        );
    };
    positionRail();
    const observer = new ResizeObserver(positionRail);
    observer.observe(container);
    if (pane) observer.observe(pane);
    if (controls) observer.observe(controls);
    viewport.addEventListener('resize', positionRail);
    viewport.addEventListener('scroll', positionRail, { passive: true });
    pane?.addEventListener('scroll', positionRail, { passive: true });
    return () => {
        observer.disconnect();
        viewport.removeEventListener('resize', positionRail);
        viewport.removeEventListener('scroll', positionRail);
        pane?.removeEventListener('scroll', positionRail);
    };
}
