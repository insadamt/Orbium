import { useRef, useState } from 'react';
import { toast } from 'sonner';
import {
    boardLimits,
    type BoardObject,
    type BoardPoint,
    type BoardBlockKind,
    type BoardPlacementKind,
} from './board-types';
import { boardDataBytes, createBoardBlockData } from './board-block-data';
import { validBoardObjects, type BoardValidationCache } from './board-api';
import { createResourceObject } from './board-resource-layout';
import { clamp } from './board-geometry';

export function useBoardObjects(
    initial: BoardObject[],
    queueSave: (objects: BoardObject[]) => void,
) {
    const [objects, setObjects] = useState(initial);
    const objectsRef = useRef(objects);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const selectedRef = useRef(selectedIds);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editorResetVersion, setEditorResetVersion] = useState(0);
    const editPoint = useRef<BoardPoint | null>(null);
    const past = useRef<BoardObject[][]>([]);
    const future = useRef<BoardObject[][]>([]);
    const historyGroup = useRef<string | null>(null);
    const lastHistoryChange = useRef(0);
    const validationCache = useRef<BoardValidationCache>(new WeakMap());

    function select(ids: string[]) {
        selectedRef.current = ids;
        setSelectedIds(ids);
    }
    function apply(next: BoardObject[]) {
        objectsRef.current = next;
        setObjects(next);
        queueSave(next);
    }
    function commit(next: BoardObject[], group: string | null = null) {
        if (next === objectsRef.current) return true;
        //
        // Object data is immutable here; reuse validated content budgets while checking every layout and aggregate limit on each commit.
        //
        if (!validBoardObjects(next, validationCache.current)) {
            toast.error('This change exceeds the Board block or data limits.');
            return false;
        }
        if (next.some((object, index) => object.layer !== index))
            next = [...next]
                .sort((first, second) => first.layer - second.layer)
                .map((object, layer) =>
                    object.layer === layer ? object : { ...object, layer },
                );
        const now = performance.now();
        if (
            !group ||
            historyGroup.current !== group ||
            now - lastHistoryChange.current > 700
        ) {
            past.current = [...past.current.slice(-39), objectsRef.current];
        }
        future.current = [];
        historyGroup.current = group;
        lastHistoryChange.current = now;
        apply(next);
        return true;
    }
    function updateMeasuredHeight(id: string, height: number) {
        const current = objectsRef.current.find((object) => object.id === id);
        if (!current || Math.abs(current.height - height) <= 1) return;
        const next = objectsRef.current.map((object) =>
            object.id === id
                ? {
                      ...object,
                      height: clamp(
                          height,
                          boardLimits.minHeight,
                          boardLimits.maxSize,
                      ),
                  }
                : object,
        );

        //
        // Measured text height follows content/width; it must not create an extra undo step or erase redo history.
        //
        apply(next);
    }
    function finishEditing() {
        historyGroup.current = null;
        editPoint.current = null;
        setEditingId(null);
    }
    function addBlock(
        point: BoardPoint,
        placementKind: BoardBlockKind | BoardPlacementKind = 'text',
        text = '',
    ) {
        if (objectsRef.current.length >= boardLimits.objects) {
            toast.error('This Board has reached its 1,000 object limit.');
            return;
        }
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
                kind === 'heading'
                    ? 480
                    : ['code', 'table', 'file', 'mermaid'].includes(kind)
                      ? 520
                      : kind === 'image'
                        ? 400
                        : 360,
            height: ['text', 'heading', 'quote', 'list', 'divider'].includes(
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
    function addResource(point: BoardPoint, targetId: number) {
        const object = createResourceObject(
            point,
            targetId,
            objectsRef.current.length,
        );
        if (!commit([...objectsRef.current, object])) return false;
        select([object.id]);
        finishEditing();
        return true;
    }
    function adoptSavedInsertion(next: BoardObject[], objectId: string) {
        if (!objectsRef.current.some((object) => object.id === objectId))
            past.current = [...past.current.slice(-39), objectsRef.current];
        future.current = [];
        historyGroup.current = null;
        objectsRef.current = next;
        setObjects(next);
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
        if (objectsRef.current.length + source.length > boardLimits.objects) {
            toast.error(
                'Duplicating these blocks would exceed the 1,000 object limit.',
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
                (object, layer) => ({ ...object, layer }),
            ),
        );
    }
    function undo() {
        const previous = past.current.pop();
        if (!previous) return;
        future.current.push(objectsRef.current);
        restoreHistorySelection(previous);
        apply(previous);
    }
    function redo() {
        const next = future.current.pop();
        if (!next) return;
        past.current.push(objectsRef.current);
        restoreHistorySelection(next);
        apply(next);
    }
    function reset(next: BoardObject[]) {
        setEditorResetVersion((version) => version + 1);
        past.current = [];
        future.current = [];
        objectsRef.current = next;
        setObjects(next);
        select([]);
        finishEditing();
    }
    function restoreHistorySelection(next: BoardObject[]) {
        setEditorResetVersion((version) => version + 1);
        historyGroup.current = null;
        const remainingIds = new Set(next.map((object) => object.id));
        select(selectedRef.current.filter((id) => remainingIds.has(id)));
        setEditingId((current) =>
            current && remainingIds.has(current) ? current : null,
        );
    }
    return {
        objects,
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
            historyGroup.current = null;
        },
        updateMeasuredHeight,
        select,
        commit,
        addBlock,
        addResource,
        adoptSavedInsertion,
        deleteSelected,
        duplicateSelected,
        changeLayer,
        undo,
        redo,
        reset,
        canUndo: past.current.length > 0,
        canRedo: future.current.length > 0,
    };
}

export type BoardObjectsController = ReturnType<typeof useBoardObjects>;
