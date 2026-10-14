import { gsap } from 'gsap';

type MenuHighlightOptions = {
    itemSelector?: string;
    selectedSelector?: string;
};

export function mountMenuHighlight(
    surface: HTMLElement,
    {
        itemSelector = '[role^="menuitem"]',
        selectedSelector = '[data-highlighted], [role="menuitem"][data-state="open"]',
    }: MenuHighlightOptions = {},
) {
    const highlight = surface.ownerDocument.createElement('div');
    highlight.className = 'app-menu-highlight';
    highlight.setAttribute('aria-hidden', 'true');
    surface.prepend(highlight);
    gsap.set(highlight, { force3D: true });
    surface.classList.add('app-menu-highlight-surface');
    const previousPosition = surface.style.position;
    const needsPosition = getComputedStyle(surface).position === 'static';
    if (needsPosition) surface.style.position = 'relative';
    const motionPreference = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
    );
    let hoveredItem: HTMLElement | null = null;
    let activeItem: HTMLElement | null = null;
    let frame = 0;
    let visible = false;

    function findItem(target: EventTarget | null) {
        const item =
            target instanceof Element
                ? target.closest<HTMLElement>(itemSelector)
                : null;
        if (
            !item ||
            !surface.contains(item) ||
            item.closest('.app-menu-highlight-surface') !== surface
        )
            return null;
        return item.matches(
            '[disabled], [data-disabled], [aria-disabled="true"]',
        )
            ? null
            : item;
    }

    function positionHighlight(animate = true) {
        const selectedItem = Array.from(
            surface.querySelectorAll<HTMLElement>(itemSelector),
        ).find((item) => item.matches(selectedSelector) && findItem(item));
        const item = hoveredItem?.isConnected ? hoveredItem : selectedItem;
        if (!item) {
            highlight.style.opacity = '0';
            visible = false;
            activeItem = null;
            return;
        }
        const bounds = item.getBoundingClientRect();
        let visibleTop = bounds.top;
        let visibleBottom = bounds.bottom;
        let visibleLeft = bounds.left;
        let visibleRight = bounds.right;
        for (
            let parent = item.parentElement;
            parent && parent !== surface;
            parent = parent.parentElement
        ) {
            const parentStyle = getComputedStyle(parent);
            const parentBounds = parent.getBoundingClientRect();
            if (/(auto|scroll|hidden|clip)/.test(parentStyle.overflowY)) {
                visibleTop = Math.max(visibleTop, parentBounds.top);
                visibleBottom = Math.min(visibleBottom, parentBounds.bottom);
            }
            if (/(auto|scroll|hidden|clip)/.test(parentStyle.overflowX)) {
                visibleLeft = Math.max(visibleLeft, parentBounds.left);
                visibleRight = Math.min(visibleRight, parentBounds.right);
            }
        }
        if (visibleBottom <= visibleTop || visibleRight <= visibleLeft) {
            gsap.killTweensOf(highlight);
            highlight.style.opacity = '0';
            visible = false;
            return;
        }
        const surfaceBounds = surface.getBoundingClientRect();
        const scaleX = surface.offsetWidth
            ? surfaceBounds.width / surface.offsetWidth
            : 1;
        const scaleY = surface.offsetHeight
            ? surfaceBounds.height / surface.offsetHeight
            : 1;
        if (!scaleX || !scaleY) return;
        const destination = {
            x:
                (visibleLeft - surfaceBounds.left) / scaleX +
                surface.scrollLeft -
                surface.clientLeft,
            y:
                (visibleTop - surfaceBounds.top) / scaleY +
                surface.scrollTop -
                surface.clientTop,
            width: (visibleRight - visibleLeft) / scaleX,
            height: (visibleBottom - visibleTop) / scaleY,
        };
        highlight.dataset.destructive = String(
            item.dataset.variant === 'destructive' ||
                item.classList.contains('text-destructive'),
        );
        highlight.style.opacity = '1';
        if (!visible || !animate || motionPreference.matches) {
            gsap.killTweensOf(highlight);
            gsap.set(highlight, destination);
        } else {
            gsap.to(highlight, {
                ...destination,
                duration: 0.2,
                ease: 'power2.out',
                overwrite: true,
            });
        }
        activeItem = item;
        visible = true;
    }

    function schedulePosition() {
        if (frame) return;
        frame = requestAnimationFrame(() => {
            frame = 0;
            positionHighlight();
        });
    }
    function pointerMoved(event: PointerEvent) {
        const item = findItem(event.target);
        if (hoveredItem === item) return;
        hoveredItem = item;
        schedulePosition();
    }
    function pointerLeft() {
        hoveredItem = null;
        schedulePosition();
    }
    function focusChanged(event: FocusEvent) {
        hoveredItem = findItem(event.target);
        schedulePosition();
    }
    function keyboardUsed() {
        hoveredItem = null;
        schedulePosition();
    }
    function scrolled() {
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        positionHighlight(false);
    }
    const observer = new MutationObserver((records) => {
        if (
            records.some(
                (record) =>
                    record.type === 'childList' || record.target !== highlight,
            )
        ) {
            if (activeItem && !surface.contains(activeItem)) hoveredItem = null;
            schedulePosition();
        }
    });
    observer.observe(surface, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: [
            'data-highlighted',
            'aria-selected',
            'aria-current',
            'data-state',
            'data-disabled',
        ],
    });
    const resizeObserver = new ResizeObserver(scrolled);
    resizeObserver.observe(surface);
    surface.addEventListener('pointermove', pointerMoved);
    surface.addEventListener('pointerleave', pointerLeft);
    surface.addEventListener('focusin', focusChanged);
    surface.addEventListener('scroll', scrolled, true);
    surface.ownerDocument.addEventListener('keydown', keyboardUsed, true);
    motionPreference.addEventListener('change', scrolled);
    positionHighlight(false);

    return () => {
        observer.disconnect();
        resizeObserver.disconnect();
        if (frame) cancelAnimationFrame(frame);
        gsap.killTweensOf(highlight);
        surface.removeEventListener('pointermove', pointerMoved);
        surface.removeEventListener('pointerleave', pointerLeft);
        surface.removeEventListener('focusin', focusChanged);
        surface.removeEventListener('scroll', scrolled, true);
        surface.ownerDocument.removeEventListener(
            'keydown',
            keyboardUsed,
            true,
        );
        motionPreference.removeEventListener('change', scrolled);
        surface.classList.remove('app-menu-highlight-surface');
        if (needsPosition) surface.style.position = previousPosition;
        highlight.remove();
    };
}
