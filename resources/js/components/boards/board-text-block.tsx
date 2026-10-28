import type { RefObject } from 'react';
import { BoardInlinePreview } from './board-inline-text';
import { BoardNativeEditor } from './board-native-editor';
import { BoardTableBlock } from './board-table-block';
import type {
    BoardBlockData,
    BoardObject,
    BoardPoint,
    BoardBlockReplacement,
} from './board-types';

export type BoardContentProps = {
    object: BoardObject;
    onObjectChange: (object: BoardObject) => boolean;
    editPoint?: RefObject<BoardPoint | null>;
    boardId: number;
    workspaceId: number;
    editing: boolean;
    editorResetVersion: number;
    readOnly: boolean;
    onChange: (data: BoardBlockData, history?: 'typing' | 'action') => boolean;
    onFinish: () => void;
    onStartEditing: () => void;
    onTransform: (replacement: BoardBlockReplacement) => boolean;
    onComposition: (active: boolean) => void;
    onHistoryBoundary?: () => void;
    onUploading: (active: boolean) => void;
};

export function BoardTextBlock(props: BoardContentProps) {
    const { object, editing, readOnly, onChange } = props;
    const { data, block_type: kind } = object;
    if (kind === 'list')
        return (
            <div className="board-list" data-list-style={data.list_style}>
                {editing ? (
                    <BoardNativeEditor key={kind} {...props} />
                ) : (
                    data.items!.map((item, index) => (
                        <div
                            className="board-list-item"
                            key={index}
                            style={{ paddingInlineStart: item.indent * 20 }}
                        >
                            {data.list_style === 'check' ? (
                                <input
                                    data-board-interactive
                                    type="checkbox"
                                    aria-label={`Complete item ${index + 1}`}
                                    checked={item.checked}
                                    disabled={readOnly}
                                    onChange={(event) =>
                                        onChange(
                                            {
                                                ...data,
                                                items: data.items!.map(
                                                    (value, position) =>
                                                        position === index
                                                            ? {
                                                                  ...value,
                                                                  checked:
                                                                      event
                                                                          .target
                                                                          .checked,
                                                              }
                                                            : value,
                                                ),
                                            },
                                            'action',
                                        )
                                    }
                                />
                            ) : (
                                <span
                                    className="board-list-marker"
                                    aria-hidden="true"
                                >
                                    {data.list_style === 'ordered'
                                        ? `${index + 1}.`
                                        : '•'}
                                </span>
                            )}
                            <div className="board-list-content">
                                <BoardInlinePreview
                                    content={item.content}
                                    workspaceId={props.workspaceId}
                                    nodeId={props.boardId}
                                />
                            </div>
                        </div>
                    ))
                )}
            </div>
        );
    if (kind === 'table') return <BoardTableBlock {...props} />;
    return (
        <div
            className={`board-writing board-writing-${kind}${kind === 'heading' ? ` cm-md-heading-${data.level}` : kind === 'quote' ? ' cm-md-quote' : kind === 'callout' ? ' editor-callout' : ''}`}
            data-level={data.level}
            dir={data.dir ?? 'auto'}
            style={{ textAlign: data.align }}
        >
            {editing ? (
                <BoardNativeEditor key={kind} {...props} />
            ) : data.content?.length ? (
                <BoardInlinePreview
                    content={data.content}
                    workspaceId={props.workspaceId}
                    nodeId={props.boardId}
                />
            ) : (
                <span className="board-text-placeholder">
                    Double-click to write · @ to link a page
                </span>
            )}
        </div>
    );
}
