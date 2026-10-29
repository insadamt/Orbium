// Summary: Renders native SVG shapes with Board-owned rich labels; depends on validated shape data and the existing inline editor/preview adapters.

import { BoardInlinePreview } from './board-inline-text';
import { BoardNativeEditor } from './board-native-editor';
import {
    boardShapePath,
    boardShapeRenderedPath,
} from './board-shape-data';
import type { BoardContentProps } from './board-text-block';

export function BoardShapeBlock(props: BoardContentProps) {
    const { data } = props.object;
    const shape = data.shape!;
    const customGeometry =
        ['rectangle', 'circle', 'triangle'].includes(shape.kind) ||
        (shape.kind === 'rounded_rectangle' &&
            shape.corner_radius !== undefined);
    const width = Math.max(1, props.object.width - 12);
    const height = Math.max(1, props.object.height - 12);
    return (
        <div className="board-shape" data-shape-kind={shape.kind}>
            <svg
                className="board-shape-vector"
                viewBox={customGeometry ? `0 0 ${width} ${height}` : '0 0 100 100'}
                preserveAspectRatio="none"
                aria-hidden="true"
            >
                <path
                    d={
                        customGeometry
                            ? boardShapeRenderedPath(shape, width, height)
                            : boardShapePath(shape.kind)
                    }
                    fill={shape.fill}
                    stroke={shape.stroke}
                    strokeWidth={shape.stroke_width}
                    strokeDasharray={
                        shape.stroke_style === 'dashed'
                            ? `${shape.stroke_width * 4} ${shape.stroke_width * 3}`
                            : undefined
                    }
                    vectorEffect="non-scaling-stroke"
                    strokeLinejoin="round"
                />
            </svg>
            <div
                className="board-shape-label"
                dir={data.dir ?? 'auto'}
                style={{ textAlign: data.align ?? 'center' }}
            >
                <div className="board-shape-label-content">
                    {props.editing ? (
                        <BoardNativeEditor {...props} />
                    ) : data.content?.length ? (
                        <BoardInlinePreview
                            content={data.content}
                            workspaceId={props.workspaceId}
                            nodeId={props.boardId}
                        />
                    ) : null}
                </div>
            </div>
        </div>
    );
}
