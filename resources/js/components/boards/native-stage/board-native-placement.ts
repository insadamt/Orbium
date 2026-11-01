// Summary: Previews click/drag shape placement with the same canonical bounds as existing Boards; depends on native visual adapters and a single completed record transaction.

import Konva from 'konva';
import {
    boardShapeDefaultSize,
    boardShapePlacementBounds,
    defaultBoardShape,
} from '../board-shape-data';
import type { BoardObject, BoardPoint } from '../board-types';
import type {
    NativeBoardGraphics,
    NativeShapeKind,
} from './board-native-graphics';
import { createNativeObjectVisual } from './board-native-object-visual';

export function createNativePlacement(
    stage: Konva.Stage,
    layer: Konva.Layer,
    graphics: NativeBoardGraphics,
    initialColor: string,
) {
    let draft: {
        start: BoardPoint;
        end: BoardPoint;
        record: BoardObject;
        group: Konva.Group;
        visual: ReturnType<typeof createNativeObjectVisual>;
    } | null = null;
    let foreground = initialColor;
    function cancel() {
        draft?.group.destroy();
        draft = null;
    }
    function move(point: BoardPoint, shift: boolean) {
        if (!draft) return;
        draft.end = point;
        const defaultSize = boardShapeDefaultSize(
            draft.record.data.shape!.kind,
        );
        const isClick =
            Math.hypot(point.x - draft.start.x, point.y - draft.start.y) *
                stage.scaleX() <
            3;
        draft.record = {
            ...draft.record,
            ...(isClick
                ? { ...draft.start, ...defaultSize }
                : boardShapePlacementBounds(draft.start, point, shift)),
        };
        draft.visual.update(draft.record);
    }
    return {
        start(kind: NativeShapeKind, point: BoardPoint) {
            cancel();
            const record: BoardObject = {
                id: crypto.randomUUID(),
                block_type: 'shape',
                content_format_version: 1,
                data: { shape: defaultBoardShape(kind), content: [] },
                ...point,
                ...boardShapeDefaultSize(kind),
                layer: graphics.store.getObjects().length,
            };
            const group = new Konva.Group({ listening: false, opacity: 0.65 });
            layer.add(group);
            const visual = createNativeObjectVisual(group, record, foreground);
            draft = { start: point, end: point, record, group, visual };
            visual.update(record);
        },
        move,
        finish(point: BoardPoint, shift: boolean) {
            if (!draft) return null;
            move(point, shift);
            const object = draft.record;
            const accepted = graphics.store.commitSnapshot([
                ...graphics.store.getObjects(),
                object,
            ]);
            cancel();
            return accepted ? object.id : null;
        },
        cancel,
        recolor(color: string) {
            foreground = color;
            draft?.visual.recolor(color);
        },
        get active() {
            return draft !== null;
        },
    };
}

export type NativePlacement = ReturnType<typeof createNativePlacement>;
