import {
    arrangeBoardObjects,
    boardArrangementActions,
} from './board-arrangement';
import { ContextMenu } from 'radix-ui';
import {
    Copy,
    Trash2,
    Pencil,
    BringToFront,
    SendToBack,
    Type,
    Hand,
    Scan,
} from 'lucide-react';
import { useRef, type ReactElement } from 'react';
import type { BoardObjectsController } from './use-board-objects';
import type { BoardCameraController } from './use-board-camera';
import type { BoardTool } from './board-types';

export function BoardContextMenu({
    children,
    model,
    camera,
    disabled,
    tool,
    onChooseTool,
    onEdit,
    onCancelGesture,
}: {
    children: ReactElement;
    model: BoardObjectsController;
    camera: BoardCameraController;
    disabled: boolean;
    tool: BoardTool;
    onChooseTool: (tool: BoardTool) => void;
    onEdit: (id: string) => void;
    onCancelGesture: () => void;
}) {
    const editingFromMenu = useRef(false);
    const selected = model.objects.filter((object) =>
        model.selectedIds.includes(object.id),
    );
    const hasResource = selected.some(
        (object) => object.block_type === 'resource',
    );
    const unavailable =
        disabled || Boolean(model.editingId) || tool !== 'select';
    return (
        <ContextMenu.Root
            modal={false}
            onOpenChange={(open) => {
                if (open) {
                    editingFromMenu.current = false;
                    onCancelGesture();
                }
            }}
        >
            <ContextMenu.Trigger
                asChild
                disabled={unavailable}
                onContextMenuCapture={(event) => {
                    if (
                        (event.target as Element).closest(
                            '[data-board-editor], [data-board-interactive], a, input, textarea, video, audio',
                        )
                    )
                        event.stopPropagation();
                }}
                onContextMenu={(event) => {
                    if (
                        unavailable ||
                        (event.target as Element).closest(
                            '[data-board-selection-drag]',
                        )
                    )
                        return;
                    const objectId = (
                        event.target as Element
                    ).closest<HTMLElement>('[data-board-object-id]')?.dataset
                        .boardObjectId;
                    if (
                        objectId &&
                        !model.selectedRef.current.includes(objectId)
                    )
                        model.select([objectId]);
                    else if (!objectId && (event.clientX || event.clientY))
                        model.select([]);
                }}
            >
                {children}
            </ContextMenu.Trigger>
            <ContextMenu.Portal>
                <ContextMenu.Content
                    className="board-context-menu glass-surface"
                    collisionPadding={12}
                    onCloseAutoFocus={(event) => {
                        event.preventDefault();
                        if (!editingFromMenu.current)
                            camera.viewportRef.current?.focus({
                                preventScroll: true,
                            });
                    }}
                >
                    {selected.length > 0 ? (
                        <>
                            <ContextMenu.Label className="board-context-label">
                                {selected.length === 1
                                    ? 'Object'
                                    : `${selected.length} selected`}
                            </ContextMenu.Label>
                            {selected.length === 1 &&
                                selected[0].block_type !== 'divider' && (
                                    <ContextMenu.Item
                                        className="board-context-item"
                                        disabled={disabled}
                                        onSelect={() => {
                                            editingFromMenu.current = true;
                                            onEdit(selected[0].id);
                                        }}
                                    >
                                        <Pencil size={15} /> Edit
                                    </ContextMenu.Item>
                                )}
                            <ContextMenu.Item
                                className="board-context-item"
                                disabled={disabled}
                                onSelect={model.duplicateSelected}
                            >
                                <Copy size={15} /> Duplicate
                            </ContextMenu.Item>
                            {selected.length >= 2 && (
                                <ContextMenu.Sub>
                                    <ContextMenu.SubTrigger className="board-context-item">
                                        Arrange selection →
                                    </ContextMenu.SubTrigger>
                                    <ContextMenu.Portal>
                                        <ContextMenu.SubContent
                                            className="board-context-menu glass-surface"
                                            collisionPadding={12}
                                        >
                                            {boardArrangementActions.map(
                                                ({
                                                    action,
                                                    label,
                                                    minimum,
                                                }) => (
                                                    <ContextMenu.Item
                                                        key={action}
                                                        className="board-context-item"
                                                        disabled={
                                                            disabled ||
                                                            selected.length <
                                                                minimum
                                                        }
                                                        onSelect={() => {
                                                            if (!disabled)
                                                                model.commit(
                                                                    arrangeBoardObjects(
                                                                        model
                                                                            .objectsRef
                                                                            .current,
                                                                        model
                                                                            .selectedRef
                                                                            .current,
                                                                        action,
                                                                    ),
                                                                );
                                                        }}
                                                    >
                                                        {label}
                                                    </ContextMenu.Item>
                                                ),
                                            )}
                                        </ContextMenu.SubContent>
                                    </ContextMenu.Portal>
                                </ContextMenu.Sub>
                            )}
                            <ContextMenu.Separator className="board-context-separator" />
                            <ContextMenu.Item
                                className="board-context-item"
                                disabled={disabled}
                                onSelect={() => model.changeLayer(true)}
                            >
                                <BringToFront size={15} /> Bring to front
                            </ContextMenu.Item>
                            <ContextMenu.Item
                                className="board-context-item"
                                disabled={disabled}
                                onSelect={() => model.changeLayer(false)}
                            >
                                <SendToBack size={15} /> Send to back
                            </ContextMenu.Item>
                            <ContextMenu.Separator className="board-context-separator" />
                            <ContextMenu.Item
                                className="board-context-item"
                                disabled={disabled}
                                onSelect={model.deleteSelected}
                            >
                                <Trash2 size={15} />
                                {hasResource
                                    ? 'Remove from board (keep pages)'
                                    : 'Delete selection'}
                            </ContextMenu.Item>
                        </>
                    ) : (
                        <>
                            <ContextMenu.Label className="board-context-label">
                                Canvas
                            </ContextMenu.Label>
                            <ContextMenu.Item
                                className="board-context-item"
                                onSelect={() => onChooseTool('text')}
                            >
                                <Type size={15} /> Place text
                            </ContextMenu.Item>
                            <ContextMenu.Item
                                className="board-context-item"
                                onSelect={() => onChooseTool('hand')}
                            >
                                <Hand size={15} /> Hand tool
                            </ContextMenu.Item>
                        </>
                    )}
                    <ContextMenu.Separator className="board-context-separator" />
                    <ContextMenu.Item
                        className="board-context-item"
                        onSelect={() => camera.fit(model.objects)}
                    >
                        <Scan size={15} /> Fit all blocks
                    </ContextMenu.Item>
                </ContextMenu.Content>
            </ContextMenu.Portal>
        </ContextMenu.Root>
    );
}
