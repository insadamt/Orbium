// Summary: Mounts the opt-in graphics adapter and exposes its effective fallback to native graphics; depends on the existing store, camera and presentation lifetime.

import {
    createContext,
    useContext,
    useLayoutEffect,
    useMemo,
    useSyncExternalStore,
} from 'react';
import type { BoardRecordStore } from '../board-record-store';
import type { BoardObject } from '../board-types';
import type { BoardCameraController } from '../use-board-camera';
import type { BoardRendererMode } from '../instant-scene/board-renderer-mode';
import { BoardKonvaScene } from './board-konva-scene';
import './board-konva.css';

export const BoardKonvaContext = createContext<BoardKonvaScene | null>(null);
const subscribeInactive = () => () => {};
const readInactive = () => false;

export function useBoardKonvaGraphics() {
    const scene = useContext(BoardKonvaContext);
    return useSyncExternalStore(
        scene?.subscribe ?? subscribeInactive,
        scene?.getActive ?? readInactive,
        readInactive,
    );
}

export function useBoardKonva({
    mode,
    store,
    camera,
    presented,
    selectedIds,
}: {
    mode: BoardRendererMode;
    store: BoardRecordStore;
    camera: BoardCameraController;
    presented: BoardObject[];
    selectedIds: readonly string[];
}) {
    //
    // The camera ref is authoritative; keep the adapter mounted across unrelated React workspace updates.
    //
    const viewportRef = camera.viewportRef;
    const worldRef = camera.worldRef;
    const cameraRef = camera.cameraRef;
    const scene = useMemo(
        () =>
            mode === 'konva' ? new BoardKonvaScene(store, { cameraRef }) : null,
        [mode, store, cameraRef],
    );
    useLayoutEffect(() => {
        if (!scene || !viewportRef.current || !worldRef.current) return;
        return scene.connect(viewportRef.current, worldRef.current);
    }, [scene, viewportRef, worldRef]);
    useLayoutEffect(() => {
        scene?.updatePresentation(presented, selectedIds);
    }, [scene, presented, selectedIds]);
    return scene;
}
