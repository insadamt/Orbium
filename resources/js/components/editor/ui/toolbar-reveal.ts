export function mountToolbarReveal(surface: HTMLElement) {
    const motionPreference = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
    );
    let animation: Animation | undefined;
    let frame = 0;
    let wasVisible = false;

    function updateVisibility() {
        frame = 0;
        const visible =
            surface.isConnected &&
            !surface.hidden &&
            surface.dataset.toolbarPositioned !== 'false' &&
            getComputedStyle(surface).visibility === 'visible' &&
            surface.getBoundingClientRect().width > 0;
        if (visible && !wasVisible && !motionPreference.matches) {
            animation?.cancel();
            animation = surface.animate(
                [
                    { opacity: 0, scale: '0.95' },
                    { opacity: 1, scale: '1' },
                ],
                { duration: 200, easing: 'ease-out' },
            );
        }
        if (!visible) animation?.cancel();
        wasVisible = visible;
    }
    function scheduleVisibilityUpdate() {
        if (!frame) frame = requestAnimationFrame(updateVisibility);
    }
    function updateMotionPreference() {
        if (motionPreference.matches) animation?.cancel();
    }
    const visibilityObserver = new MutationObserver(scheduleVisibilityUpdate);
    visibilityObserver.observe(surface, {
        attributes: true,
        attributeFilter: ['hidden', 'style', 'data-toolbar-positioned'],
    });
    const sizeObserver = new ResizeObserver(scheduleVisibilityUpdate);
    sizeObserver.observe(surface);
    motionPreference.addEventListener('change', updateMotionPreference);
    scheduleVisibilityUpdate();
    return () => {
        cancelAnimationFrame(frame);
        animation?.cancel();
        visibilityObserver.disconnect();
        sizeObserver.disconnect();
        motionPreference.removeEventListener('change', updateMotionPreference);
    };
}
