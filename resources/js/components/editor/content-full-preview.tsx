import * as Dialog from '@radix-ui/react-dialog';
import { Maximize, Minus, Plus, X } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
type ContentFullPreviewOptions = {
    content: HTMLElement;
    dimensions: { width: number; height: number };
    title: string;
    canvasLabel: string;
    fitLabel: string;
    trigger: HTMLElement;
};

type Transform = { scale: number; x: number; y: number };
const minimumScale = 0.05;
const maximumScale = 8;

function ContentFullPreview({
    options,
    dispose,
}: {
    options: ContentFullPreviewOptions;
    dispose: () => void;
}) {
    const { content, dimensions, title, canvasLabel, fitLabel } = options;
    const [open, setOpen] = useState(true);
    const viewport = useRef<HTMLDivElement>(null);
    const drawing = useRef<HTMLDivElement>(null);
    const drag = useRef<{ pointerId: number; x: number; y: number } | null>(
        null,
    );
    const [transform, setTransform] = useState<Transform>({
        scale: 1,
        x: 0,
        y: 0,
    });
    function fitToView() {
        const area = viewport.current;
        if (!area) return;
        const scale = Math.max(
            minimumScale,
            Math.min(
                1,
                (area.clientWidth - 64) / dimensions.width,
                (area.clientHeight - 176) / dimensions.height,
            ),
        );
        setTransform({
            scale,
            x: (area.clientWidth - dimensions.width * scale) / 2,
            y: 80 + (area.clientHeight - 176 - dimensions.height * scale) / 2,
        });
    }

    function zoomBy(factor: number, point?: { x: number; y: number }) {
        const area = viewport.current;
        if (!area) return;
        const anchor = point ?? {
            x: area.clientWidth / 2,
            y: area.clientHeight / 2,
        };
        setTransform((previous) => {
            const scale = Math.max(
                minimumScale,
                Math.min(maximumScale, previous.scale * factor),
            );
            const ratio = scale / previous.scale;
            return {
                scale,
                x: anchor.x - (anchor.x - previous.x) * ratio,
                y: anchor.y - (anchor.y - previous.y) * ratio,
            };
        });
    }

    useLayoutEffect(() => {
        if (drawing.current) drawing.current.replaceChildren(content);
        const area = viewport.current;
        if (!area) return;
        fitToView();
        const observer = new ResizeObserver(fitToView);
        observer.observe(area);
        const handleWheel = (event: WheelEvent) => {
            event.preventDefault();
            const bounds = area.getBoundingClientRect();
            zoomBy(
                Math.exp(-Math.max(-100, Math.min(100, event.deltaY)) * 0.002),
                {
                    x: event.clientX - bounds.left,
                    y: event.clientY - bounds.top,
                },
            );
        };
        area.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
            observer.disconnect();
            area.removeEventListener('wheel', handleWheel);
        };
    }, [content, dimensions]);

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Portal container={document.body}>
                <Dialog.Overlay className="mermaid-full-overlay" />
                <Dialog.Content
                    className="mermaid-full-dialog"
                    onCloseAutoFocus={(event) => {
                        event.preventDefault();
                        dispose();
                    }}
                >
                    <header className="mermaid-full-header">
                        <div>
                            <Dialog.Title className="mermaid-full-title">
                                {title}
                            </Dialog.Title>
                            <Dialog.Description className="sr-only">
                                Scroll to zoom · Drag to pan · Escape to close
                            </Dialog.Description>
                        </div>
                        <Dialog.Close asChild>
                            <button
                                type="button"
                                className="mermaid-full-close"
                                aria-label={`Close ${title.toLowerCase()}`}
                            >
                                <X size={19} />
                            </button>
                        </Dialog.Close>
                    </header>
                    <div className="mermaid-full-actions">
                        <button
                            type="button"
                            title="Zoom out"
                            aria-label="Zoom out"
                            disabled={transform.scale <= minimumScale}
                            onClick={() => zoomBy(1 / 1.25)}
                        >
                            <Minus size={16} />
                        </button>
                        <output
                            aria-label="Zoom level"
                            className="min-w-14 text-center text-xs tabular-nums"
                        >
                            {Math.round(transform.scale * 100)}%
                        </output>
                        <button
                            type="button"
                            title="Zoom in"
                            aria-label="Zoom in"
                            disabled={transform.scale >= maximumScale}
                            onClick={() => zoomBy(1.25)}
                        >
                            <Plus size={16} />
                        </button>
                        <button
                            type="button"
                            aria-label={fitLabel}
                            onClick={fitToView}
                        >
                            <Maximize size={16} />
                            <span>Fit to view</span>
                        </button>
                    </div>

                    <div
                        ref={viewport}
                        className="mermaid-full-viewport"
                        tabIndex={0}
                        aria-label={canvasLabel}
                        onKeyDown={(event) => {
                            if (event.ctrlKey || event.metaKey || event.altKey)
                                return;
                            if (event.key === '+' || event.key === '=')
                                zoomBy(1.25);
                            else if (event.key === '-') zoomBy(1 / 1.25);
                            else if (event.key === '0') fitToView();
                            else if (event.key.startsWith('Arrow'))
                                setTransform((previous) => ({
                                    ...previous,
                                    x:
                                        previous.x +
                                        (event.key === 'ArrowLeft'
                                            ? 40
                                            : event.key === 'ArrowRight'
                                              ? -40
                                              : 0),
                                    y:
                                        previous.y +
                                        (event.key === 'ArrowUp'
                                            ? 40
                                            : event.key === 'ArrowDown'
                                              ? -40
                                              : 0),
                                }));
                            else return;
                            event.preventDefault();
                            event.stopPropagation();
                        }}
                        onPointerDown={(event) => {
                            if (event.button !== 0 || drag.current) return;
                            drag.current = {
                                pointerId: event.pointerId,
                                x: event.clientX,
                                y: event.clientY,
                            };
                            event.currentTarget.setPointerCapture(
                                event.pointerId,
                            );
                            event.currentTarget.focus();
                        }}
                        onPointerMove={(event) => {
                            const previous = drag.current;
                            if (
                                !previous ||
                                previous.pointerId !== event.pointerId
                            )
                                return;
                            const x = event.clientX - previous.x;
                            const y = event.clientY - previous.y;
                            drag.current = {
                                pointerId: event.pointerId,
                                x: event.clientX,
                                y: event.clientY,
                            };
                            setTransform((value) => ({
                                ...value,
                                x: value.x + x,
                                y: value.y + y,
                            }));
                        }}
                        onPointerUp={() => {
                            drag.current = null;
                        }}
                        onPointerCancel={() => {
                            drag.current = null;
                        }}
                        onLostPointerCapture={() => {
                            drag.current = null;
                        }}
                    >
                        <div
                            ref={drawing}
                            className="mermaid-full-drawing full-preview-content"
                            style={{
                                width: dimensions.width,
                                height: dimensions.height,
                                transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                            }}
                        />
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

export function openContentFullPreview(
    options: ContentFullPreviewOptions,
): () => void {
    const { trigger } = options;
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    let disposed = false;
    const dispose = () => {
        if (disposed) return;
        disposed = true;
        // Radix retains the dialog through its exit animation; widget teardown skips it.
        queueMicrotask(() => {
            root.unmount();
            host.remove();
            if (trigger.isConnected) trigger.focus({ preventScroll: true });
        });
    };
    root.render(<ContentFullPreview options={options} dispose={dispose} />);
    return dispose;
}
