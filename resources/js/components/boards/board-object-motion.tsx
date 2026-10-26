import { useLayoutEffect, useRef } from 'react';
import type { BoardRecordStore } from './board-record-store';
import { mountBoardSceneMotion } from './board-scene-motion';

export function BoardObjectMotion({ store }: { store: BoardRecordStore }) {
    const layer = useRef<HTMLDivElement>(null);
    useLayoutEffect(() => {
        const surface = layer.current;
        //
        // Ancestor refs attach after child layout effects; the owned layer already has its live canvas ancestors.
        //
        const viewport = surface?.closest<HTMLElement>('.board-canvas');
        const world = surface?.closest<HTMLElement>('.board-world');
        if (!surface || !viewport || !world) return;
        return mountBoardSceneMotion(store, viewport, world, surface);
    }, [store]);
    return (
        <div
            ref={layer}
            className="board-object-motion-layer"
            aria-hidden="true"
            inert
        />
    );
}
