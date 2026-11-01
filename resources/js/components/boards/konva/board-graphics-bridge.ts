// Summary: Connects existing imperative Board paint boundaries to the opt-in graphics adapter; depends only on Board geometry and disposable preview data.

import type { BoardObject, BoardPoint } from '../board-types';
import type { BoardBrush } from '../board-drawing-data';

export type BoardStrokePoint = [number, number];
export type BoardStrokePreview = {
    completed: Path2D;
    tail: BoardStrokePoint[];
    brush: BoardBrush;
    highlighter: boolean;
};
export type BoardGraphicsBridge = {
    active: boolean;
    paintCamera: () => void;
    paintObjects: (objects: BoardObject[]) => void;
    paintStroke: (preview: BoardStrokePreview | null) => void;
    paintPath: (
        points: BoardStrokePoint[],
        hover: BoardPoint | null,
        brush: BoardBrush,
    ) => void;
    paintErasure: (id: string, fragments: BoardStrokePoint[][] | null) => void;
};

const adapters = new WeakMap<HTMLElement, BoardGraphicsBridge>();

export function attachBoardGraphics(
    viewport: HTMLElement,
    bridge: BoardGraphicsBridge,
) {
    adapters.set(viewport, bridge);
    return () => {
        if (adapters.get(viewport) === bridge) adapters.delete(viewport);
    };
}

export function boardGraphics(viewport: HTMLElement | null) {
    const bridge = viewport ? adapters.get(viewport) : undefined;
    return bridge?.active ? bridge : undefined;
}

export function paintBoardGraphicsCamera(viewport: HTMLElement | null) {
    if (viewport) adapters.get(viewport)?.paintCamera();
}
