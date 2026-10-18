function wheelDistance(event: WheelEvent, pane: HTMLElement) {
    if (event.deltaMode === 2) return event.deltaY * pane.clientHeight;
    if (event.deltaMode === 1) {
        const lineHeight = Number.parseFloat(getComputedStyle(pane).lineHeight);
        return event.deltaY * (Number.isFinite(lineHeight) ? lineHeight : 16);
    }
    return event.deltaY;
}

function nestedContentOwnsWheel(event: WheelEvent, boundary: EventTarget) {
    for (const target of event.composedPath()) {
        if (target === boundary) break;
        const element = target as Element;
        if (element.nodeType !== 1) continue;
        if (
            element === element.ownerDocument.scrollingElement ||
            element === element.ownerDocument.body
        )
            continue;
        const styles =
            element.ownerDocument.defaultView?.getComputedStyle(element);
        if (!styles || !/(auto|scroll)/.test(styles.overflowY)) continue;
        if (['contain', 'none'].includes(styles.overscrollBehaviorY))
            return true;
        if (
            (event.deltaY < 0 && element.scrollTop > 0) ||
            (event.deltaY > 0 &&
                element.scrollTop + element.clientHeight < element.scrollHeight)
        )
            return true;
    }
    return false;
}

export function attachPaneWheelScrolling({
    pane,
    eventTarget,
}: {
    pane: HTMLElement;
    eventTarget: Document;
}) {
    function scrollPane(event: WheelEvent) {
        if (
            event.ctrlKey ||
            event.metaKey ||
            !event.deltaY ||
            !event.cancelable
        )
            return;
        if (
            event.defaultPrevented ||
            nestedContentOwnsWheel(event, eventTarget)
        )
            return;
        event.preventDefault();
        const distance = wheelDistance(event, pane);
        pane.scrollTop += distance;
    }

    eventTarget.addEventListener('wheel', scrollPane as EventListener, {
        passive: false,
        capture: true,
    });
    return () => {
        eventTarget.removeEventListener(
            'wheel',
            scrollPane as EventListener,
            true,
        );
    };
}

export function attachWorkspaceWheelScrolling(workspace: HTMLElement) {
    const ownerDocument = workspace.ownerDocument;
    function scrollOutsideDocuments(event: WheelEvent) {
        if (
            event.defaultPrevented ||
            event.ctrlKey ||
            event.metaKey ||
            !event.deltaY ||
            !event.cancelable
        )
            return;
        const target = event.target as Element;
        const pane = target.closest?.('.split-pane:not([hidden])');
        if (pane && target.closest?.('.floating-body-island, iframe')) return;
        if (target.closest?.('.document-outline-widget')) return;
        if (nestedContentOwnsWheel(event, pane ?? ownerDocument.body)) return;
        const panes = workspace.querySelectorAll<HTMLElement>(
            '.split-pane:not([hidden])',
        );
        if (!panes.length) return;
        event.preventDefault();
        const distance = wheelDistance(event, panes[0]);
        panes.forEach((pane) => {
            pane.scrollTop += distance;
        });
    }
    ownerDocument.addEventListener('wheel', scrollOutsideDocuments, {
        passive: false,
    });
    return () =>
        ownerDocument.removeEventListener('wheel', scrollOutsideDocuments);
}
