import {
    useLayoutEffect,
    useRef,
    type RefObject,
    type Dispatch,
    type SetStateAction,
} from 'react';

type Options = {
    viewport: RefObject<HTMLDivElement | null>;
    scale: number;
    fit: number;
    panPadding: number;
    sceneLeft: number;
    sceneTop: number;
    setZoom: Dispatch<SetStateAction<number | null>>;
};

export function useMindMapZoomInput(options: Options) {
    const current = useRef(options);
    current.current = options;
    const skipReveal = useRef(false);
    const anchor = useRef<{
        x: number;
        y: number;
        worldX: number;
        worldY: number;
    } | null>(null);
    useLayoutEffect(() => {
        const host = options.viewport.current;
        if (!host) return;
        const keyboardSurface =
            host.closest<HTMLElement>('[data-mindmap-dialog]') ?? host;
        function zoomBy(factor: number, clientX?: number, clientY?: number) {
            const value = current.current;
            const nextScale = Math.max(
                0.0001,
                Math.min(2.5, value.scale * factor),
            );
            if (nextScale === value.scale) return;
            const bounds = host!.getBoundingClientRect();
            const x =
                clientX === undefined
                    ? host!.clientWidth / 2
                    : clientX - bounds.left;
            const y =
                clientY === undefined
                    ? host!.clientHeight / 2
                    : clientY - bounds.top;
            anchor.current = {
                x,
                y,
                worldX: (host!.scrollLeft + x - value.sceneLeft) / value.scale,
                worldY: (host!.scrollTop + y - value.sceneTop) / value.scale,
            };
            skipReveal.current = true;
            value.setZoom(nextScale);
        }
        const wheel = (event: WheelEvent) => {
            event.preventDefault();
            event.stopPropagation();
            const delta =
                event.deltaY *
                (event.deltaMode === 1
                    ? 16
                    : event.deltaMode === 2
                      ? host.clientHeight
                      : 1);
            zoomBy(
                Math.exp(-Math.max(-100, Math.min(100, delta)) * 0.002),
                event.clientX,
                event.clientY,
            );
        };
        const keydown = (event: KeyboardEvent) => {
            if (event.isComposing || event.altKey || event.defaultPrevented)
                return;
            const target = event.target as Element | null;
            if (
                target?.closest('[role="dialog"]') &&
                target.closest('[role="dialog"]') !== keyboardSurface &&
                keyboardSurface !== host
            )
                return;
            const editing = target?.closest(
                'input, textarea, [contenteditable="true"]',
            );
            if (editing && !event.ctrlKey && !event.metaKey) return;
            if (
                event.key === '+' ||
                event.key === '=' ||
                event.code === 'NumpadAdd'
            )
                zoomBy(1.25);
            else if (event.key === '-' || event.code === 'NumpadSubtract')
                zoomBy(1 / 1.25);
            else if (event.key === '0') {
                anchor.current = null;
                skipReveal.current =
                    current.current.scale !== current.current.fit;
                host.scrollTo(
                    current.current.panPadding,
                    current.current.panPadding,
                );
                current.current.setZoom(current.current.fit);
            } else return;
            //
            // Consume browser zoom shortcuts before the Board or page can apply their own transforms.
            //
            event.preventDefault();
            event.stopPropagation();
        };
        host.addEventListener('wheel', wheel, { passive: false });
        keyboardSurface.addEventListener('keydown', keydown, true);
        return () => {
            host.removeEventListener('wheel', wheel);
            keyboardSurface.removeEventListener('keydown', keydown, true);
        };
    }, [options.viewport]);
    useLayoutEffect(() => {
        const pending = anchor.current;
        const host = options.viewport.current;
        if (!pending || !host) return;
        host.scrollLeft =
            options.sceneLeft + pending.worldX * options.scale - pending.x;
        host.scrollTop =
            options.sceneTop + pending.worldY * options.scale - pending.y;
        anchor.current = null;
    }, [options.scale, options.sceneLeft, options.sceneTop, options.viewport]);
    return skipReveal;
}
