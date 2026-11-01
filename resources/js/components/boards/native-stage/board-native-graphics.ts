// Summary: Owns disposable graphics projections and scratch record transactions for shapes and ink; depends on canonical BoardRecordStore, domain limits and native visual adapters, without server persistence.

import Konva from 'konva';
import {
    defaultBoardShape,
    boardShapeDefaultSize,
    boardShapeKinds,
} from '../board-shape-data';
import { BoardRecordStore } from '../board-record-store';
import {
    boardLimits,
    type BoardBounds,
    type BoardObject,
    type BoardPoint,
    type BoardShapeKind,
} from '../board-types';
import {
    createNativeObjectVisual,
    type NativeObjectVisual,
} from './board-native-object-visual';

export type NativeShapeKind = BoardShapeKind;

export function createNativeBoardGraphics(
    layer: Konva.Layer,
    initialColor: string,
) {
    const store = new BoardRecordStore([], () => {});
    const groups = new Map<string, Konva.Group>();
    const visuals = new Map<string, NativeObjectVisual>();
    const metrics = {
        created: 0,
        destroyed: 0,
        recordTransactions: 0,
        erasurePreviews: 0,
        transformPreviews: 0,
    };
    let foreground = initialColor;
    let draggable = true;

    function restore(id: string) {
        const record = store.getObject(id);
        if (record) visuals.get(id)?.update(record);
    }
    const unsubscribe = store.subscribeChanges((ids) => {
        metrics.recordTransactions++;
        for (const id of ids) {
            const object = store.getObject(id);
            let group = groups.get(id);
            if (!object) {
                if (group) {
                    group.destroy();
                    groups.delete(id);
                    visuals.delete(id);
                    metrics.destroyed++;
                }
                continue;
            }
            if (!group) {
                group = new Konva.Group({
                    id,
                    name: 'native-board-object',
                    draggable,
                });
                layer.add(group);
                visuals.set(
                    id,
                    createNativeObjectVisual(group, object, foreground),
                );
                group.on('dragend.records', () => {
                    const current = store.getObject(id);
                    const node = groups.get(id);
                    if (
                        !current ||
                        !node ||
                        (node.x() === current.x && node.y() === current.y)
                    )
                        return;
                    const x = Math.max(
                        -boardLimits.coordinate,
                        Math.min(boardLimits.coordinate, node.x()),
                    );
                    const y = Math.max(
                        -boardLimits.coordinate,
                        Math.min(boardLimits.coordinate, node.y()),
                    );
                    if (!store.changeObject({ ...current, x, y })) restore(id);
                });
                groups.set(id, group);
                metrics.created++;
            }
            visuals.get(id)!.update(object);
            group.zIndex(
                Math.min(object.layer + 1, layer.getChildren().length - 1),
            );
        }
    });

    function makeShape(
        kind: NativeShapeKind,
        bounds: BoardBounds,
        layerIndex: number,
    ): BoardObject {
        return {
            id: crypto.randomUUID(),
            block_type: 'shape',
            content_format_version: 1,
            data: { shape: defaultBoardShape(kind), content: [] },
            ...bounds,
            layer: layerIndex,
        };
    }
    return {
        store,
        groups,
        metrics,
        insert(
            kind: NativeShapeKind,
            point: BoardPoint,
            size = boardShapeDefaultSize(kind),
        ) {
            const object = makeShape(
                kind,
                { ...point, ...size },
                store.getObjects().length,
            );
            return store.commitSnapshot([...store.getObjects(), object])
                ? object.id
                : null;
        },
        insertDrawing(object: BoardObject) {
            return store.commitSnapshot([
                ...store.getObjects(),
                { ...object, layer: store.getObjects().length },
            ]);
        },
        replaceFixture(count: number) {
            store.replaceSnapshot(
                Array.from({ length: count }, (_, index) =>
                    makeShape(
                        boardShapeKinds[index % boardShapeKinds.length],
                        {
                            x: 80 + (index % 40) * 280,
                            y: 100 + Math.floor(index / 40) * 240,
                            ...boardShapeDefaultSize(
                                boardShapeKinds[index % boardShapeKinds.length],
                            ),
                        },
                        index,
                    ),
                ),
            );
        },
        setDraggable(enabled: boolean) {
            if (draggable === enabled) return;
            draggable = enabled;
            groups.forEach((group) => group.draggable(enabled));
        },
        recolor(color: string) {
            foreground = color;
            visuals.forEach((visual) => visual.recolor(color));
        },
        previewGeometry(object: BoardObject) {
            visuals.get(object.id)?.update(object);
            metrics.transformPreviews++;
        },
        paintErasure(id: string, fragments: [number, number][][] | null) {
            visuals.get(id)?.replaceFragments(fragments);
            metrics.erasurePreviews++;
        },
        restore,
        cancelDrags() {
            groups.forEach((group, id) => {
                const record = store.getObject(id);
                //
                // Native touch cancellation may mark a drag stopped before this capture handler runs; geometry must still be restored before dragend can commit it.
                //
                if (
                    record &&
                    (group.x() !== record.x ||
                        group.y() !== record.y ||
                        group.scaleX() !== 1 ||
                        group.scaleY() !== 1)
                )
                    restore(id);
                group.stopDrag();
            });
        },
        dispose() {
            unsubscribe();
            groups.forEach((group) => group.destroy());
            metrics.destroyed += groups.size;
            groups.clear();
            visuals.clear();
        },
    };
}

export type NativeBoardGraphics = ReturnType<typeof createNativeBoardGraphics>;
