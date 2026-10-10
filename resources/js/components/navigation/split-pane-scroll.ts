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
    function scrollPanes(event: WheelEvent) {
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

    eventTarget.addEventListener('wheel', scrollPanes as EventListener, {
        passive: false,
        capture: true,
    });
    return () =>
        eventTarget.removeEventListener(
            'wheel',
            scrollPanes as EventListener,
            true,
        );
}

export function attachWorkspaceWheelScrolling(workspace: HTMLElement) {
    function scrollOutsidePanes(event: WheelEvent) {
        if (
            event.defaultPrevented ||
            event.ctrlKey ||
            event.metaKey ||
            !event.deltaY ||
            !event.cancelable
        )
            return;
        const target = event.target as Element;
        if (target.closest?.('.split-pane:not([hidden])')) return;
        if (nestedContentOwnsWheel(event, document.body)) return;
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
    document.addEventListener('wheel', scrollOutsidePanes, { passive: false });
    return () => document.removeEventListener('wheel', scrollOutsidePanes);
}
