import type { BoardDrawingController } from './use-board-drawing';

export function BoardDrawingPreview({
    drawing,
}: {
    drawing: BoardDrawingController;
}) {
    return (
        <svg className="board-drawing-preview" aria-hidden="true">
            <path
                ref={drawing.previewPathRef}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                ref={drawing.path.pathRef}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <g ref={drawing.path.anchorsRef} />
        </svg>
    );
}
