// Summary: Presents saved vector ink or delegates to the active Konva plane; depends on canonical fragments and the opt-in compatibility fallback.

import { boardDrawingStrokePath } from './board-drawing-data';
import { useBoardKonvaGraphics } from './konva/use-board-konva';
import type { BoardDrawing } from './board-types';

export function BoardDrawingStroke({ drawing }: { drawing: BoardDrawing }) {
    const konvaGraphics = useBoardKonvaGraphics();
    if (konvaGraphics) return null;
    return (
        <svg
            className="board-drawing-stroke"
            viewBox={`0 0 ${drawing.view_width} ${drawing.view_height}`}
            preserveAspectRatio="none"
            aria-hidden="true"
        >
            <path
                d={boardDrawingStrokePath(drawing)}
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
