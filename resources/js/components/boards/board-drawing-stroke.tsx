import { boardDrawingPath } from './board-drawing-data';
import type { BoardDrawing } from './board-types';

export function BoardDrawingStroke({ drawing }: { drawing: BoardDrawing }) {
    return (
        <svg
            className="board-drawing-stroke"
            viewBox={`0 0 ${drawing.view_width} ${drawing.view_height}`}
            preserveAspectRatio="none"
            aria-hidden="true"
        >
            <path
                d={boardDrawingPath(drawing.points)}
                fill="none"
                stroke={drawing.color}
                strokeWidth={drawing.stroke_width}
                strokeOpacity={drawing.opacity}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
