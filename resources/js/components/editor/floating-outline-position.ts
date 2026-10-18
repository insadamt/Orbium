export function attachFloatingOutlinePositioning(
    host: HTMLElement,
    container: HTMLElement,
) {
    const documentViewport = container.ownerDocument.defaultView ?? window;
    const frame = documentViewport.frameElement as HTMLElement | null;
    const pane =
        container.closest<HTMLElement>('[data-split-pane-id]') ??
        frame?.closest<HTMLElement>('[data-split-pane-id]');
    const viewport = host.ownerDocument.defaultView ?? documentViewport;
    const controls = viewport.document.querySelector('.floating-top-controls');
    const positionRail = () => {
        const currentPane =
            container.closest<HTMLElement>('[data-split-pane-id]') ??
            frame?.closest<HTMLElement>('[data-split-pane-id]');
        const paneBounds = currentPane?.getBoundingClientRect();
        const documentBounds = container.getBoundingClientRect();
        const frameBounds = frame?.getBoundingClientRect();
        const embedded = container.ownerDocument !== host.ownerDocument;
        const frameLeft = embedded ? (frameBounds?.left ?? 0) : 0;
        const headerBottom = controls?.getBoundingClientRect().bottom ?? 80;
        const visibleTop = Math.max(headerBottom + 24, paneBounds?.top ?? 0);
        const visibleBottom = Math.min(
            viewport.innerHeight - 24,
            paneBounds?.bottom ?? viewport.innerHeight,
        );
        const viewportCenter = viewport.innerHeight / 2;
        const availableHeight = Math.max(
            0,
            2 *
                Math.min(
                    viewportCenter - visibleTop,
                    visibleBottom - viewportCenter,
                ),
        );
        host.style.left = `${documentBounds.right + frameLeft - host.offsetWidth}px`;
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
    observer.observe(host);
    if (pane) observer.observe(pane);
    if (controls) observer.observe(controls);
    viewport.addEventListener('resize', positionRail);
    viewport.addEventListener('scroll', positionRail, {
        passive: true,
        capture: true,
    });
    if (documentViewport !== viewport) {
        documentViewport.addEventListener('resize', positionRail);
        documentViewport.addEventListener('scroll', positionRail, {
            passive: true,
            capture: true,
        });
    }
    return () => {
        observer.disconnect();
        viewport.removeEventListener('resize', positionRail);
        viewport.removeEventListener('scroll', positionRail, true);
        if (documentViewport !== viewport) {
            documentViewport.removeEventListener('resize', positionRail);
            documentViewport.removeEventListener('scroll', positionRail, true);
        }
    };
}
