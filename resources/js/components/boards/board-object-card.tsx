import { BoardMindMapBlock } from './board-mindmap-block';
import { useBoardEditMotion } from './use-board-edit-motion';
import { BoardDrawingStroke } from './board-drawing-stroke';
import {
    supportsBoardContentHeight,
    measureBoardContentHeight,
} from './board-content-sizing';
import { BoardResourceBlock } from './board-resource-block';
import {
    memo,
    useRef,
    useLayoutEffect,
    useCallback,
    type RefObject,
    type CSSProperties,
} from 'react';
import { BoardTextBlock } from './board-text-block';
import { BoardSourceBlock } from './board-source-block';
import { BoardMediaBlock } from './board-media-block';
import { boardBlockLabels, boardBlockText } from './board-block-data';
import type { BoardInstantScene } from './instant-scene/board-instant-scene';
import { BoardPreparedSurface } from './instant-scene/board-prepared-surface';
import type {
    BoardBlockData,
    BoardLocation,
    BoardObject,
    BoardPoint,
    BoardBlockReplacement,
} from './board-types';
export const BoardObjectCard = memo(function BoardObjectCard({
    tabId,
    onResourceLock,
    object,
    location,
    selected,
    editing,
    blocked,
    onEdit,
    onFinish,
    onChange,
    onComposition,
    onUploading,
    onSelect,
    onHeightChange,
    onObjectChange,
    onHistoryBoundary,
    editPoint,
    onTransform,
    editorResetVersion,
    instantScene,
}: {
    tabId: string;
    onResourceLock: (objectId: string, locked: boolean) => void;
    object: BoardObject;
    location: BoardLocation;
    selected: boolean;
    editing: boolean;
    blocked: boolean;
    onEdit: (id: string) => void;
    onFinish: () => void;
    onChange: (
        id: string,
        data: BoardBlockData,
        history?: 'typing' | 'action',
    ) => boolean;
    onComposition: (active: boolean) => void;
    onUploading: (active: boolean) => void;
    onSelect: (id: string) => void;
    onHeightChange: (id: string, height: number) => void;
    onObjectChange: (object: BoardObject) => boolean;
    onHistoryBoundary: () => void;
    editPoint: RefObject<BoardPoint | null>;
    onTransform: (id: string, replacement: BoardBlockReplacement) => boolean;
    editorResetVersion: number;
    instantScene?: BoardInstantScene | null;
}) {
    const updateResourceLock = useCallback(
        (locked: boolean) => onResourceLock(object.id, locked),
        [object.id, onResourceLock],
    );
    const body = useRef<HTMLDivElement>(null);
    useBoardEditMotion(body, editing);
    const autoHeight = supportsBoardContentHeight(object);
    useLayoutEffect(() => {
        if (!autoHeight || blocked) return;
        const content = body.current?.firstElementChild as HTMLElement | null;
        if (!content) return;
        let frame: number | undefined;
        const measureContent = () => {
            frame = undefined;
            if (
                body.current?.closest<HTMLElement>('.board-canvas')?.dataset
                    .gesture === 'resize'
            )
                return;
            onHeightChange(
                object.id,
                //
                // Legacy manual heights stay readable but must not leave empty space after content is removed.
                //
                body.current ? measureBoardContentHeight(body.current) : 32,
            );
        };
        const observer = new ResizeObserver(() => {
            if (frame === undefined)
                frame = requestAnimationFrame(measureContent);
        });
        observer.observe(content);
        measureContent();
        return () => {
            observer.disconnect();
            if (frame !== undefined) cancelAnimationFrame(frame);
        };
    }, [
        object.id,
        object.data.text_scale,
        object.width,
        object.block_type,
        editing,
        autoHeight,
        blocked,
        onHeightChange,
    ]);
    const props = {
        object,
        onObjectChange,
        ...location,
        editing,
        readOnly: blocked,
        onChange: (data: BoardBlockData, history?: 'typing' | 'action') =>
            onChange(object.id, data, history),
        onFinish,
        onComposition,
        onHistoryBoundary,
        onUploading,
        editPoint,
        editorResetVersion,
        onStartEditing: () => onEdit(object.id),
        onTransform: (replacement: BoardBlockReplacement) =>
            onTransform(object.id, replacement),
    };
    //
    // Native content owns its document surface; an outer Board card would frame the same block twice.
    //
    const transparent = object.block_type !== 'resource';
    return (
        <div
            className="board-object"
            data-board-object-id={object.id}
            data-board-kind={object.block_type}
            data-surface={transparent ? 'bare' : 'content'}
            data-selected={selected}
            data-editing={editing}
            data-automatic-height={autoHeight}
            data-board-drag={!editing || undefined}
            role="group"
            tabIndex={0}
            aria-label={`${boardBlockLabels[object.data.media_kind ?? object.block_type]}: ${boardBlockText(object).slice(0, 80) || 'Empty'}`}
            style={
                {
                    left: object.x,
                    top: object.y,
                    width: object.width,
                    height: object.height,
                    zIndex: object.layer + 1,
                    '--board-content-scale': object.data.text_scale ?? 1,
                    '--board-frame-width': `${object.width - 2}px`,
                    '--board-frame-height': `${object.height - 2}px`,
                } as CSSProperties
            }
            onFocus={(event) => {
                if (event.target === event.currentTarget) onSelect(object.id);
            }}
            onDoubleClick={(event) => {
                if (!event.currentTarget.contains(event.target as Node)) return;
                event.stopPropagation();
                if (
                    !blocked &&
                    !editing &&
                    !['divider', 'drawing'].includes(object.block_type) &&
                    !(event.target as Element).closest(
                        '[data-board-resize], [data-board-interactive], button, a, input, textarea, select, video, audio',
                    )
                ) {
                    editPoint.current = { x: event.clientX, y: event.clientY };
                    onEdit(object.id);
                }
            }}
        >
            <div
                ref={body}
                className={`board-object-body board-object-preview${object.block_type === 'resource' ? '' : ' orbium-editor orbium-markdown-content'}`}
                data-board-scroll
            >
                {object.block_type === 'mindmap' ? (
                    <BoardMindMapBlock {...props} />
                ) : object.block_type === 'drawing' && object.data.drawing ? (
                    <BoardDrawingStroke drawing={object.data.drawing} />
                ) : !editing && instantScene?.supports(object) ? (
                    <BoardPreparedSurface {...props} scene={instantScene} />
                ) : object.block_type === 'resource' ? (
                    <BoardResourceBlock
                        {...props}
                        tabId={tabId}
                        onLockedChange={updateResourceLock}
                    />
                ) : [
                      'text',
                      'heading',
                      'list',
                      'quote',
                      'callout',
                      'table',
                  ].includes(object.block_type) ? (
                    <BoardTextBlock {...props} />
                ) : ['code', 'math', 'mermaid'].includes(object.block_type) ? (
                    <BoardSourceBlock {...props} />
                ) : object.block_type === 'divider' ? (
                    <hr className="board-divider" />
                ) : (
                    <BoardMediaBlock {...props} pdfScene={instantScene?.pdfs} />
                )}
            </div>
            {selected && !blocked && !editing && (
                <>
                    {(autoHeight
                        ? ['e', 'w', 'nw', 'ne', 'sw', 'se']
                        : ['n', 'e', 's', 'w', 'nw', 'ne', 'sw', 'se']
                    ).map((axis) => (
                        <span
                            key={axis}
                            data-board-resize={axis}
                            className={`board-resize board-resize-${axis}`}
                        />
                    ))}
                </>
            )}
        </div>
    );
});
