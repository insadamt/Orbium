function displayedScale(element: HTMLElement) {
    const logicalWidth = element.offsetWidth;
    if (!logicalWidth) return 1;
    return Math.max(0.01, element.getBoundingClientRect().width / logicalWidth);
}

export function pdfOutputScale(
    element: HTMLElement,
    page: { width: number; height: number },
) {
    //
    // Nested Board camera/block zoom increases required pixels without changing the PDF's logical page dimensions.
    //
    return Math.min(
        Math.min(window.devicePixelRatio || 1, 2) * displayedScale(element),
        Math.sqrt(8_388_608 / (page.width * page.height)),
    );
}

export function observePdfDisplayDensity(
    element: HTMLElement,
    onChange: () => void,
) {
    let previousScale = displayedScale(element);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const checkDensity = () => {
        const nextScale = displayedScale(element);
        if (Math.abs(nextScale - previousScale) < 0.001) return;
        previousScale = nextScale;
        onChange();
    };
    let world: HTMLElement | null = null;
    let object: HTMLElement | null = null;
    const densitySignature = () =>
        `${world?.style.zoom ?? ''}:${object?.style.getPropertyValue('--board-content-scale') ?? ''}`;
    let previousSignature = '';
    const mutations = new MutationObserver(() => {
        //
        // Translation changes style too, but cannot change PDF pixel density; avoid per-frame timers and later layout reads.
        //
        const signature = densitySignature();
        if (signature === previousSignature) return;
        previousSignature = signature;
        //
        // Wait for zoom/resize gestures to settle; panning at the same scale must not keep cancelling a PDF render.
        //
        clearTimeout(timer);
        timer = setTimeout(checkDensity, 120);
    });
    return {
        refresh() {
            mutations.disconnect();
            world = element.closest<HTMLElement>('.board-world');
            object = element.closest<HTMLElement>('[data-board-object-id]');
            previousSignature = densitySignature();
            for (const ancestor of [world, object]) {
                if (ancestor)
                    mutations.observe(ancestor, {
                        attributes: true,
                        attributeFilter: ['style'],
                    });
            }
            checkDensity();
        },
        destroy() {
            clearTimeout(timer);
            mutations.disconnect();
        },
    };
}
