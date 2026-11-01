// Summary: Adapts scratch BoardRecordStore shapes to native Konva primitives and commits completed drags; depends on existing shape defaults and validation, with no server persistence.

import Konva from 'konva';
import { defaultBoardShape, boardShapeDefaultSize } from '../board-shape-data';
import { BoardRecordStore } from '../board-record-store';
import { boardLimits, type BoardObject, type BoardPoint } from '../board-types';

export type NativeShapeKind = 'rectangle' | 'circle' | 'triangle';

export function createNativeBoardGraphics(layer: Konva.Layer, color: string) {
    const store = new BoardRecordStore([], () => {});
    const groups = new Map<string, Konva.Group>();
    const metrics = { created: 0, destroyed: 0, recordTransactions: 0 };
    let stroke = color;
    let draggable = true;

    function createShape(object: BoardObject) {
        const appearance = {
            stroke,
            strokeWidth: 2,
            fill: undefined,
            perfectDrawEnabled: false,
        };
        if (object.data.shape?.kind === 'circle')
            return new Konva.Ellipse({
                ...appearance,
                x: object.width / 2,
                y: object.height / 2,
                radiusX: object.width / 2,
                radiusY: object.height / 2,
            });
        if (object.data.shape?.kind === 'triangle')
            return new Konva.Line({
                ...appearance,
                points: [
                    object.width / 2,
                    0,
                    object.width,
                    object.height,
                    0,
                    object.height,
                ],
                closed: true,
            });
        return new Konva.Rect({
            ...appearance,
            width: object.width,
            height: object.height,
        });
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
                group.add(createShape(object));
                group.on('dragend.records', () => {
                    const current = store.getObject(id);
                    const node = groups.get(id);
                    if (!current || !node) return;
                    if (node.x() === current.x && node.y() === current.y)
                        return;
                    const x = Math.max(
                        -boardLimits.coordinate,
                        Math.min(boardLimits.coordinate, node.x()),
                    );
                    const y = Math.max(
                        -boardLimits.coordinate,
                        Math.min(boardLimits.coordinate, node.y()),
                    );
                    if (!store.changeObject({ ...current, x, y }))
                        node.position({ x: current.x, y: current.y });
                });
                groups.set(id, group);
                layer.add(group);
                metrics.created++;
            }
            group.position({ x: object.x, y: object.y });
        }
    });

    function makeRecord(
        kind: NativeShapeKind,
        point: BoardPoint,
        layerIndex: number,
    ): BoardObject {
        return {
            id: crypto.randomUUID(),
            block_type: 'shape',
            content_format_version: 1,
            data: { shape: defaultBoardShape(kind), content: [] },
            ...point,
            ...boardShapeDefaultSize(kind),
            layer: layerIndex,
        };
    }

    return {
        store,
        groups,
        metrics,
        insert(kind: NativeShapeKind, point: BoardPoint) {
            const objects = store.getObjects();
            const object = makeRecord(kind, point, objects.length);
            return store.commitSnapshot([...objects, object])
                ? object.id
                : null;
        },
        replaceFixture(count: number) {
            const kinds: NativeShapeKind[] = [
                'rectangle',
                'circle',
                'triangle',
            ];
            const objects = Array.from({ length: count }, (_, index) =>
                makeRecord(
                    kinds[index % kinds.length],
                    {
                        x: 80 + (index % 40) * 280,
                        y: 100 + Math.floor(index / 40) * 240,
                    },
                    index,
                ),
            );
            store.replaceSnapshot(objects);
        },
        setDraggable(enabled: boolean) {
            draggable = enabled;
            groups.forEach((group) => group.draggable(enabled));
        },
        recolor(nextColor: string) {
            stroke = nextColor;
            groups.forEach((group) =>
                group
                    .getChildren()
                    .forEach((node) => (node as Konva.Shape).stroke(stroke)),
            );
        },
        cancelDrags() {
            groups.forEach((group, id) => {
                const record = store.getObject(id);
                //
                // Restore before stopDrag emits dragend so cancellation cannot commit preview coordinates.
                //
                if (record) group.position({ x: record.x, y: record.y });
                group.stopDrag();
            });
        },
        dispose() {
            unsubscribe();
            groups.forEach((group) => group.destroy());
            metrics.destroyed += groups.size;
            groups.clear();
        },
    };
}

export type NativeBoardGraphics = ReturnType<typeof createNativeBoardGraphics>;
