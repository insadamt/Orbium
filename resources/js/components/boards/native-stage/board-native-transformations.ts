// Summary: Uses Konva Transformer gestures for single-object resizing and scratch selection, committing geometry once; depends on canonical records, native object projections and existing size limits.

import Konva from 'konva';
import { boardLimits, type BoardObject } from '../board-types';
import type { NativeBoardGraphics } from './board-native-graphics';

export function createNativeTransformations({
    stage,
    layer,
    graphics,
    color,
    notify,
}: {
    stage: Konva.Stage;
    layer: Konva.Layer;
    graphics: NativeBoardGraphics;
    color: string;
    notify: (object: BoardObject | null) => void;
}) {
    let selectedId: string | null = null;
    let preview: BoardObject | null = null;
    const transformer = new Konva.Transformer({
        rotateEnabled: false,
        flipEnabled: false,
        keepRatio: false,
        ignoreStroke: true,
        padding: 1,
        borderStroke: color,
        anchorStroke: color,
        anchorFill: color,
        anchorSize: 8,
        borderStrokeWidth: 1.5,
        boundBoxFunc(oldBox, nextBox) {
            const zoom = stage.scaleX();
            return nextBox.width < boardLimits.minWidth * zoom ||
                nextBox.height < boardLimits.minHeight * zoom ||
                nextBox.width > boardLimits.maxSize * zoom ||
                nextBox.height > boardLimits.maxSize * zoom
                ? oldBox
                : nextBox;
        },
    });
    layer.add(transformer);
    function select(id: string | null) {
        selectedId = id && graphics.store.getObject(id) ? id : null;
        const object = selectedId
            ? graphics.store.getObject(selectedId)!
            : null;
        const group = selectedId ? graphics.groups.get(selectedId) : null;
        transformer.nodes(group ? [group] : []);
        transformer.keepRatio(object?.block_type === 'drawing');
        transformer.moveToTop();
        notify(object);
    }
    transformer.on('transformstart.native-transform', (event) => {
        preview = graphics.store.getObject(event.target.id()) ?? null;
    });
    transformer.on('transform.native-transform', (event) => {
        if (!preview || event.target.id() !== preview.id) return;
        const group = graphics.groups.get(preview.id)!;
        preview = {
            ...preview,
            x: Math.max(
                -boardLimits.coordinate,
                Math.min(boardLimits.coordinate, group.x()),
            ),
            y: Math.max(
                -boardLimits.coordinate,
                Math.min(boardLimits.coordinate, group.y()),
            ),
            width: Math.max(
                boardLimits.minWidth,
                Math.min(boardLimits.maxSize, preview.width * group.scaleX()),
            ),
            height: Math.max(
                boardLimits.minHeight,
                Math.min(boardLimits.maxSize, preview.height * group.scaleY()),
            ),
        };
        graphics.previewGeometry(preview);
        transformer.forceUpdate();
    });
    transformer.on('transformend.native-transform', () => {
        const finished = preview;
        preview = null;
        if (!finished) return;
        const original = graphics.store.getObject(finished.id);
        if (
            !original ||
            (original.x === finished.x &&
                original.y === finished.y &&
                original.width === finished.width &&
                original.height === finished.height)
        )
            return;
        if (!graphics.store.changeObject(finished))
            graphics.restore(finished.id);
        transformer.forceUpdate();
    });
    const unsubscribe = graphics.store.subscribeChanges(() => {
        if (selectedId) select(selectedId);
    });
    return {
        transformer,
        select,
        cancel() {
            const current = preview;
            preview = null;
            if (current) graphics.restore(current.id);
            if (transformer.isTransforming()) transformer.stopTransform();
            transformer.forceUpdate();
        },
        get active() {
            return transformer.isTransforming();
        },
        get selectedId() {
            return selectedId;
        },
        recolor(next: string) {
            transformer.borderStroke(next);
            transformer.anchorStroke(next);
            transformer.anchorFill(next);
        },
        dispose() {
            unsubscribe();
            transformer.off('.native-transform');
            transformer.destroy();
        },
    };
}

export type NativeTransformations = ReturnType<
    typeof createNativeTransformations
>;
