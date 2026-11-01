// Summary: Paints the original 32-unit grid using one reusable pattern tile instead of per-dot nodes or camera-sized allocations; depends on the Stage transform and theme color.

import Konva from 'konva';

export function createNativeBoardGrid(
    stage: Konva.Stage,
    initialColor: string,
) {
    const tile = document.createElement('canvas');
    tile.width = 256;
    tile.height = 256;
    let color = initialColor;
    let preparedZoom = 0;
    let pattern: CanvasPattern | null = null;

    const node = new Konva.Shape({
        name: 'native-board-grid',
        listening: false,
        perfectDrawEnabled: false,
        sceneFunc(context) {
            const zoom = stage.scaleX();
            if (preparedZoom !== zoom) {
                const tileContext = tile.getContext('2d');
                if (!tileContext) return;
                tileContext.clearRect(0, 0, 256, 256);
                tileContext.fillStyle = color;
                tileContext.beginPath();
                tileContext.arc(128, 128, (0.8 * 8) / zoom, 0, Math.PI * 2);
                tileContext.fill();
                pattern = context.createPattern(tile, 'repeat');
                //
                // Keep the tile at 32 world units and its dot at a constant screen radius; pans reuse both tile and pattern.
                //
                pattern?.setTransform(
                    new DOMMatrix().scale(1 / 8).translate(-128, -128),
                );
                preparedZoom = zoom;
            }
            if (!pattern) return;
            context.setAttr('fillStyle', pattern);
            context.setAttr('globalAlpha', 0.22);
            context.fillRect(
                -stage.x() / zoom,
                -stage.y() / zoom,
                stage.width() / zoom,
                stage.height() / zoom,
            );
        },
    });

    return {
        node,
        tile,
        recolor(next: string) {
            color = next;
            preparedZoom = 0;
            node.getLayer()?.batchDraw();
        },
        dispose() {
            node.destroy();
            tile.width = 0;
            tile.height = 0;
            pattern = null;
        },
    };
}
