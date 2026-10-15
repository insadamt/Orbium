type AlignmentMotionRequest = {
    container: HTMLElement;
    readElements: () => HTMLElement[];
    applyChange: () => boolean | void;
    measureText?: boolean;
    onComplete?: () => void;
};

const activeTransitions = new WeakMap<HTMLElement, () => void>();

function visibleContentBounds(element: HTMLElement, measureText: boolean) {
    if (!measureText) return element.getBoundingClientRect();
    const range = element.ownerDocument.createRange();
    range.selectNodeContents(element);
    const bounds = Array.from(range.getClientRects()).filter(
        (rect) => rect.width > 0 && rect.height > 0,
    );
    if (!bounds.length) return element.getBoundingClientRect();
    return {
        left: Math.min(...bounds.map((rect) => rect.left)),
        top: Math.min(...bounds.map((rect) => rect.top)),
    };
}

export function animateAlignmentChange({
    container,
    readElements,
    applyChange,
    measureText = true,
    onComplete,
}: AlignmentMotionRequest) {
    const ownerWindow = container.ownerDocument.defaultView;
    if (!ownerWindow) return applyChange();
    const preference = ownerWindow.matchMedia(
        '(prefers-reduced-motion: reduce)',
    );
    const before = readElements().map((element) =>
        visibleContentBounds(element, measureText),
    );
    activeTransitions.get(container)?.();
    const changed = applyChange();
    if (changed === false || preference.matches || !before.length)
        return changed;
    let animations: Animation[] = [];
    let frame = ownerWindow.requestAnimationFrame(() => {
        frame = 0;
        if (
            !container.isConnected ||
            !container.getBoundingClientRect().width
        ) {
            finish();
            return;
        }
        animations = readElements().flatMap((element, index) => {
            const previous = before[index];
            if (!previous || !element.isConnected) return [];
            const bounds = visibleContentBounds(element, measureText);
            const scale = element.offsetWidth
                ? element.getBoundingClientRect().width / element.offsetWidth
                : 1;
            const distance = (previous.left - bounds.left) / (scale || 1);
            if (Math.abs(distance) < 0.5) return [];
            return [
                element.animate(
                    [{ translate: `${distance}px 0` }, { translate: '0px 0' }],
                    { duration: 260, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
                ),
            ];
        });
        if (!animations.length) finish();
        else
            void Promise.allSettled(
                animations.map((animation) => animation.finished),
            ).then(finish);
    });
    function finish() {
        if (activeTransitions.get(container) !== finish) return;
        ownerWindow!.cancelAnimationFrame(frame);
        animations.forEach((animation) => animation.cancel());
        container.ownerDocument.removeEventListener(
            'pointerdown',
            finish,
            true,
        );
        container.ownerDocument.removeEventListener(
            'beforeinput',
            finish,
            true,
        );
        container.ownerDocument.removeEventListener('keydown', finish, true);
        container.ownerDocument.removeEventListener('wheel', finish, true);
        preference.removeEventListener('change', finish);
        activeTransitions.delete(container);
        if (container.isConnected) onComplete?.();
    }
    activeTransitions.set(container, finish);
    container.ownerDocument.addEventListener('pointerdown', finish, true);
    container.ownerDocument.addEventListener('beforeinput', finish, true);
    container.ownerDocument.addEventListener('keydown', finish, true);
    container.ownerDocument.addEventListener('wheel', finish, true);
    preference.addEventListener('change', finish);
    return changed;
}
