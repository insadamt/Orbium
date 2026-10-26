import { MoveHorizontal } from 'lucide-react';
import { useEffect, useRef } from 'react';
import {
    clampMindMapTopicWidth,
    mindMapTopicWidth,
} from './mindmap-topic-width';

type Props = {
    width: number;
    scale: number;
    side: number;
    onPreview: (width: number | null) => void;
    onCommit: (width: number) => boolean;
};
type WidthGesture = {
    pointerId: number;
    x: number;
    width: number;
    scale: number;
    direction: number;
};

export function MindMapWidthHandle(props: Props) {
    const handle = useRef<HTMLButtonElement>(null);
    const callbacks = useRef(props);
    callbacks.current = props;
    const gesture = useRef<WidthGesture | null>(null);
    const frame = useRef(0);
    const pendingWidth = useRef(props.width);
    function cancelPreview() {
        cancelAnimationFrame(frame.current);
        frame.current = 0;
        if (!gesture.current) return;
        gesture.current = null;
        if (handle.current) delete handle.current.dataset.mindmapResizing;
        callbacks.current.onPreview(null);
    }
    useEffect(() => {
        const document = handle.current?.ownerDocument;
        const cancelFromKeyboard = (event: KeyboardEvent) => {
            if (!gesture.current || event.isComposing) return;
            if (
                event.key !== 'Escape' &&
                !(
                    (event.ctrlKey || event.metaKey) &&
                    ['z', 'y'].includes(event.key.toLowerCase())
                )
            )
                return;
            event.preventDefault();
            event.stopPropagation();
            cancelPreview();
        };
        //
        // Cancelling a live preview must happen before the owner consumes history or dismisses the dialog.
        //
        document?.addEventListener('keydown', cancelFromKeyboard, true);
        return () => {
            document?.removeEventListener('keydown', cancelFromKeyboard, true);
            cancelPreview();
        };
    }, []);
    function widthAt(clientX: number) {
        const origin = gesture.current!;
        return clampMindMapTopicWidth(
            origin.width +
                ((clientX - origin.x) / origin.scale) * origin.direction,
        );
    }
    return (
        <button
            ref={handle}
            type="button"
            className="mindmap-width-handle"
            data-side={props.side}
            role="separator"
            aria-orientation="vertical"
            aria-label="Topic width"
            aria-valuemin={mindMapTopicWidth.min}
            aria-valuemax={mindMapTopicWidth.max}
            aria-valuenow={props.width}
            aria-valuetext={`${props.width} pixels`}
            title="Drag to resize topic width · Arrow keys: 10 px · Shift: 50 px · Double-click: reset"
            onClick={(event) => event.stopPropagation()}
            onDoubleClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                if (props.width !== mindMapTopicWidth.default)
                    props.onCommit(mindMapTopicWidth.default);
            }}
            onKeyDown={(event) => {
                if (event.key === 'Escape' && gesture.current) {
                    event.preventDefault();
                    event.stopPropagation();
                    cancelPreview();
                    return;
                }
                if (
                    event.ctrlKey ||
                    event.metaKey ||
                    event.altKey ||
                    !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(
                        event.key,
                    )
                )
                    return;
                event.preventDefault();
                event.stopPropagation();
                const direction = props.side < 0 ? -1 : 1;
                const next =
                    event.key === 'Home'
                        ? mindMapTopicWidth.min
                        : event.key === 'End'
                          ? mindMapTopicWidth.max
                          : clampMindMapTopicWidth(
                                props.width +
                                    (event.key === 'ArrowLeft' ? -1 : 1) *
                                        direction *
                                        (event.shiftKey ? 50 : 10),
                            );
                if (next !== props.width) props.onCommit(next);
            }}
            onPointerDown={(event) => {
                if (event.button !== 0 || gesture.current) return;
                event.preventDefault();
                event.stopPropagation();
                //
                // Keep the text caret intact when resizing a branch that is still being edited.
                //
                if (
                    !event.currentTarget.parentElement?.querySelector(
                        '[data-mindmap-topic-editor]',
                    )
                )
                    event.currentTarget.focus({ preventScroll: true });
                event.currentTarget.setPointerCapture(event.pointerId);
                gesture.current = {
                    pointerId: event.pointerId,
                    x: event.clientX,
                    width: props.width,
                    scale: props.scale,
                    direction: props.side < 0 ? -1 : 1,
                };
                event.currentTarget.dataset.mindmapResizing = 'true';
                props.onPreview(props.width);
            }}
            onPointerMove={(event) => {
                if (gesture.current?.pointerId !== event.pointerId) return;
                event.stopPropagation();
                pendingWidth.current = widthAt(event.clientX);
                //
                // Pointer samples only update a transient preview once per frame; the owner receives one completed resize.
                //
                if (!frame.current)
                    frame.current = requestAnimationFrame(() => {
                        frame.current = 0;
                        callbacks.current.onPreview(pendingWidth.current);
                    });
            }}
            onPointerUp={(event) => {
                if (gesture.current?.pointerId !== event.pointerId) return;
                event.preventDefault();
                event.stopPropagation();
                const next = widthAt(event.clientX);
                const original = gesture.current.width;
                delete event.currentTarget.dataset.mindmapResizing;
                cancelAnimationFrame(frame.current);
                frame.current = 0;
                gesture.current = null;
                if (event.currentTarget.hasPointerCapture(event.pointerId))
                    event.currentTarget.releasePointerCapture(event.pointerId);
                if (next !== original) props.onCommit(next);
                props.onPreview(null);
            }}
            onPointerCancel={cancelPreview}
            onLostPointerCapture={cancelPreview}
        >
            <MoveHorizontal size={14} aria-hidden="true" />
        </button>
    );
}
