// Summary: Publishes validated Board insertions, editing and history actions; depends on the record store, native content defaults and geometry bounds.

import {
    useEffect,
    useMemo,
    useRef,
    useState,
    useSyncExternalStore,
} from 'react';
import { toast } from 'sonner';
import {
    boardLimits,
    type BoardObject,
    type BoardPoint,
    type BoardBlockKind,
    type BoardPlacementKind,
} from './board-types';
import { boardDataBytes, createBoardBlockData } from './board-block-data';
import { validBoardObjects } from './board-api';
import { BoardRecordStore, type BoardObjectSource } from './board-record-store';
import { createResourceObject } from './board-resource-layout';
import { defaultBoardShape } from './board-shape-data';
import type { BoardBounds, BoardShapeKind } from './board-types';
import { clamp } from './board-geometry';

export function useBoardObjects(
    initial: BoardObject[],
    queueSave: (source: BoardObjectSource) => void,
) {
    const saveCallback = useRef(queueSave);
    saveCallback.current = queueSave;
    const [store] = useState(
        () =>
            new BoardRecordStore(initial, (source) =>
                saveCallback.current(source),
            ),
    );
    const layoutObjects = useSyncExternalStore(
        store.subscribeLayout,
        store.getLayoutSnapshot,
        store.getLayoutSnapshot,
    );
    const historyState = useSyncExternalStore(
        store.subscribeHistory,
        store.getHistoryState,
        store.getHistoryState,
    );
    const objectsRef = useMemo(
        () => ({
            get current() {
                return store.getObjects();
            },
        }),
        [store],
    );
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const selectedRef = useRef(selectedIds);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editorResetVersion, setEditorResetVersion] = useState(0);
    const editPoint = useRef<BoardPoint | null>(null);
    const measuredHeights = useRef(
        new Map<string, { object: BoardObject; height: number }>(),
    );
    const heightFrame = useRef<number | undefined>(undefined);

    useEffect(
        () => () => {
            if (heightFrame.current !== undefined)
                cancelAnimationFrame(heightFrame.current);
            heightFrame.current = undefined;
            measuredHeights.current.clear();
        },
        [],
    );

    function select(ids: string[]) {
        selectedRef.current = ids;
        setSelectedIds(ids);
    }
    function commit(next: BoardObject[], group: string | null = null) {
        const accepted = store.commitSnapshot(next, group);
        if (!accepted) {
            toast.error('This change exceeds the Board block or data limits.');
        }
        return accepted;
    }
    function changeObject(
        replacement: BoardObject,
        group: string | null = null,
    ) {
        const accepted = store.changeObject(replacement, group);
        if (!accepted)
            toast.error('This change exceeds the Board block or data limits.');
        return accepted;
    }
    function updateMeasuredHeight(id: string, height: number) {
        const current = store.getObject(id);
        if (!current || Math.abs(current.height - height) <= 1) return;
        measuredHeights.current.set(id, {
            object: current,
            height: clamp(height, boardLimits.minHeight, boardLimits.maxSize),
        });
        if (heightFrame.current !== undefined) return;
        //
        // Opening many cards must publish one derived layout, rather than map and save the whole Board once per measured card.
        //
        heightFrame.current = requestAnimationFrame(() => {
            heightFrame.current = undefined;
            store.applyMeasuredHeights(measuredHeights.current);
            measuredHeights.current.clear();
        });
    }

    function finishEditing() {
        store.history.breakGroup();
        editPoint.current = null;
        setEditingId(null);
    }
    function addBlock(
        point: BoardPoint,
        placementKind: BoardBlockKind | BoardPlacementKind = 'text',
        text = '',
    ) {
        const mediaKind = ['pdf', 'video', 'audio'].includes(placementKind)
            ? (placementKind as 'pdf' | 'video' | 'audio')
            : undefined;
        //
        // Media choices remain file objects so existing attachment usage and Board formats still apply.
        //
        const kind: BoardBlockKind = mediaKind
            ? 'file'
            : (placementKind as BoardBlockKind);
        const object: BoardObject = {
            id: crypto.randomUUID(),
            block_type: kind,
            content_format_version: 1,
            data: {
                ...createBoardBlockData(kind, text),
                ...(mediaKind ? { media_kind: mediaKind } : {}),
            },
            x: clamp(point.x, -boardLimits.coordinate, boardLimits.coordinate),
            y: clamp(point.y, -boardLimits.coordinate, boardLimits.coordinate),
            width:
                kind === 'mindmap'
                    ? 760
                    : kind === 'heading'
                      ? 480
                      : ['code', 'table', 'file', 'mermaid'].includes(kind)
                        ? 520
                        : kind === 'image'
                          ? 400
                          : 360,
            height:
                kind === 'mindmap'
                    ? 460
                    : ['text', 'heading', 'quote', 'list', 'divider'].includes(
                            kind,
                        )
                      ? kind === 'heading'
                          ? 80
                          : 56
                      : 300,
            layer:
                Math.max(-1, ...objectsRef.current.map((item) => item.layer)) +
                1,
        };
        const next = [...objectsRef.current, object];
        if (!validBoardObjects(next)) {
            toast.error(
                'This block exceeds the 256 KiB block or 4 MiB Board text limit.',
            );
            return;
        }
        commit(next);
        select([object.id]);
        setEditingId(kind === 'divider' ? null : object.id);
    }
    function addShape(kind: BoardShapeKind, bounds: BoardBounds) {
        const object: BoardObject = {
            id: crypto.randomUUID(),
            block_type: 'shape',
            content_format_version: 1,
            data: {
                shape: defaultBoardShape(kind),
                content: [],
                align: 'center',
            },
            ...bounds,
            x: clamp(bounds.x, -boardLimits.coordinate, boardLimits.coordinate),
            y: clamp(bounds.y, -boardLimits.coordinate, boardLimits.coordinate),
            layer: objectsRef.current.length,
        };
        if (!commit([...objectsRef.current, object])) return false;
        finishEditing();
        select([object.id]);
        return true;
    }
    function addResource(point: BoardPoint, targetId: number) {
        const object = createResourceObject(
            point,
            targetId,
            objectsRef.current.length,
        );
        if (!commit([...objectsRef.current, object])) return false;
        select([object.id]);
        finishEditing();
        setEditingId(object.id);
        return true;
    }
    function adoptSavedInsertion(next: BoardObject[], objectId: string) {
        store.replaceSnapshot(next, true);
        select([objectId]);
        setEditingId(objectId);
    }
    function deleteSelected() {
        if (!selectedRef.current.length) return;
        commit(
            objectsRef.current.filter(
                (object) => !selectedRef.current.includes(object.id),
            ),
        );
        select([]);
        finishEditing();
    }
    function duplicateSelected() {
        const source = objectsRef.current.filter((object) =>
            selectedRef.current.includes(object.id),
        );
        if (!source.length) return;
        const bytes = [...objectsRef.current, ...source].reduce(
            (total, object) => total + boardDataBytes(object.data),
            0,
        );
        if (bytes > boardLimits.totalBytes) {
            toast.error(
                'Duplicating these blocks would exceed the 4 MiB Board text limit.',
            );
            return;
        }
        const firstLayer =
            Math.max(-1, ...objectsRef.current.map((item) => item.layer)) + 1;
        const copies = source.map((object, index) => ({
            ...object,
            id: crypto.randomUUID(),
            x: clamp(
                object.x + 32,
                -boardLimits.coordinate,
                boardLimits.coordinate,
            ),
            y: clamp(
                object.y + 32,
                -boardLimits.coordinate,
                boardLimits.coordinate,
            ),
            layer: firstLayer + index,
        }));
        commit([...objectsRef.current, ...copies]);
        select(copies.map((object) => object.id));
        finishEditing();
    }
    function changeLayer(front: boolean) {
        const sorted = [...objectsRef.current].sort(
            (a, b) => a.layer - b.layer,
        );
        const selected = sorted.filter((object) =>
            selectedRef.current.includes(object.id),
        );
        const others = sorted.filter(
            (object) => !selectedRef.current.includes(object.id),
        );
        if (!selected.length) return;
        commit(
            (front ? [...others, ...selected] : [...selected, ...others]).map(
                (object, layer) =>
                    object.layer === layer ? object : { ...object, layer },
            ),
        );
    }
    function undo() {
        if (store.undo()) restoreHistorySelection();
    }
    function redo() {
        if (store.redo()) restoreHistorySelection();
    }
    function reset(next: BoardObject[]) {
        setEditorResetVersion((version) => version + 1);
        store.replaceSnapshot(next);
        select([]);
        finishEditing();
    }
    function restoreHistorySelection() {
        setEditorResetVersion((version) => version + 1);
        select(selectedRef.current.filter((id) => store.getObject(id)));
        setEditingId((current) =>
            current && store.getObject(current) ? current : null,
        );
    }
    return {
        store,
        layoutObjects,
        get objects() {
            return store.getObjects();
        },
        objectsRef,
        selectedIds,
        selectedRef,
        editingId,
        editorResetVersion,
        resetEditorContent: () =>
            setEditorResetVersion((version) => version + 1),
        editPoint,
        setEditingId,
        finishEditing,
        breakHistoryGroup: () => {
            store.history.breakGroup();
        },
        changeObject,
        updateMeasuredHeight,
        select,
        commit,
        addBlock,
        addShape,
        addResource,
        adoptSavedInsertion,
        deleteSelected,
        duplicateSelected,
        changeLayer,
        undo,
        redo,
        reset,
        canUndo: Boolean(historyState & 1),
        canRedo: Boolean(historyState & 2),
    };
}

export type BoardObjectsController = ReturnType<typeof useBoardObjects>;
