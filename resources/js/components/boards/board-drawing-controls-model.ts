// Summary: Defines the drawing palette's small presentation contract so both Board engines reuse the same controls; depends on brush/smoothing values and explicit Path Pen actions, not either camera or pointer engine.

import type { Dispatch, SetStateAction } from 'react';
import type { BoardBrush } from './board-drawing-data';
import type { BoardDrawingSmoothing } from './board-drawing-smoothing';

export type BoardDrawingControlsModel = {
    brush: BoardBrush;
    setBrush: Dispatch<SetStateAction<BoardBrush>>;
    smoothing: BoardDrawingSmoothing;
    setSmoothing: Dispatch<SetStateAction<BoardDrawingSmoothing>>;
    eraserSize: number;
    setEraserSize: Dispatch<SetStateAction<number>>;
    path: {
        pointCount: number;
        finish: () => void;
        removeLastPoint: () => unknown;
        cancel: () => unknown;
    };
};
