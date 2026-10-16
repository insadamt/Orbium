import type { EditorView } from '@codemirror/view';

type DragPointer = { clientX: number; clientY: number };

function measureHostProjection(view: EditorView) {
    let ownerWindow = view.dom.ownerDocument.defaultView;
    let offsetX = 0;
    let offsetY = 0;
    let scaleX = 1;
    let scaleY = 1;
    while (ownerWindow?.frameElement) {
        const frame = ownerWindow.frameElement as HTMLElement;
        const bounds = frame.getBoundingClientRect();
        const frameScaleX = bounds.width / (frame.offsetWidth || 1);
        const frameScaleY = bounds.height / (frame.offsetHeight || 1);
        if (frameScaleX <= 0 || frameScaleY <= 0) break;
        offsetX = (offsetX + frame.clientLeft) * frameScaleX + bounds.left;
        offsetY = (offsetY + frame.clientTop) * frameScaleY + bounds.top;
        scaleX *= frameScaleX;
        scaleY *= frameScaleY;
        ownerWindow = frame.ownerDocument.defaultView;
    }
    return { offsetX, offsetY, scaleX, scaleY };
}

export function captureMarkdownDragPointer(
    view: EditorView,
    pointer: DragPointer,
): () => DragPointer {
    const initial = measureHostProjection(view);
    const hostX = pointer.clientX * initial.scaleX + initial.offsetX;
    const hostY = pointer.clientY * initial.scaleY + initial.offsetY;
    return () => {
        // Host scrolling moves an iframe beneath a stationary captured pointer.
        const current = measureHostProjection(view);
        return {
            clientX: (hostX - current.offsetX) / current.scaleX,
            clientY: (hostY - current.offsetY) / current.scaleY,
        };
    };
}
