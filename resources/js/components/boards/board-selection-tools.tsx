import { useRef, useState } from 'react';
import { BoardPropertiesPanel } from './board-properties-panel';
import type { BoardObject } from './board-types';
import { BoardTextStyleMenu } from './board-text-style-menu';
import { Check, Pencil } from 'lucide-react';
import { BoardToolButton } from './board-tool-button';
import { BoardSelectionActions } from './board-selection-actions';
import type { BoardObjectsController } from './use-board-objects';
import type { BoardCameraController } from './use-board-camera';
import { useBoardSelectionAnchor } from './use-board-selection-anchor';
import { boardBlockLabels } from './board-block-data';
export function BoardSelectionTools({
    boardId,
    model,
    camera,
    editing,
    disabled,
    busy,
    onEdit,
    onFinish,
    onChange,
}: {
    boardId: number;
    model: BoardObjectsController;
    camera: BoardCameraController;
    editing: boolean;
    disabled: boolean;
    busy: boolean;
    onEdit: (id: string) => void;
    onFinish: () => void;
    onChange: (object: BoardObject) => void;
}) {
    const [propertiesOpen, setPropertiesOpen] = useState(false);
    const selectionActionsButton = useRef<HTMLButtonElement>(null);
    const toolbarRef = useBoardSelectionAnchor(
        camera,
        model.selectedIds,
        editing,
        propertiesOpen,
    );
    const object =
        model.selectedIds.length === 1
            ? model.objects.find((item) => item.id === model.selectedIds[0])
            : undefined;
    const writing =
        object &&
        ['text', 'heading', 'quote', 'callout'].includes(object.block_type);
    return (
        <>
            <div
                ref={toolbarRef}
                className="board-selection-tools board-panel glass-surface"
                data-board-editor
                hidden={!model.selectedIds.length}
            >
                {model.selectedIds.length > 1 && (
                    <span className="board-selection-label">
                        {model.selectedIds.length} selected
                    </span>
                )}
                {object && (
                    <>
                        {writing ? (
                            <BoardTextStyleMenu
                                object={object}
                                disabled={disabled}
                                onChange={onChange}
                            />
                        ) : (
                            <span className="board-selection-label">
                                {boardBlockLabels[object.block_type]}
                            </span>
                        )}
                        {object.block_type !== 'divider' && (
                            <BoardToolButton
                                label={
                                    editing ? 'Finish editing' : 'Edit block'
                                }
                                icon={editing ? Check : Pencil}
                                data-board-edit-toggle
                                data-done={editing}
                                shortcut={editing ? 'Ctrl/Cmd+Enter' : 'Enter'}
                                disabled={busy || (disabled && !editing)}
                                onClick={() =>
                                    editing ? onFinish() : onEdit(object.id)
                                }
                            >
                                {editing ? 'Done' : 'Edit'}
                            </BoardToolButton>
                        )}
                    </>
                )}
                <div id={`board-formatting-${boardId}`} />
                <BoardSelectionActions
                    model={model}
                    disabled={disabled}
                    editing={editing}
                    propertiesOpen={propertiesOpen}
                    onToggleProperties={() =>
                        setPropertiesOpen((value) => !value)
                    }
                    triggerRef={selectionActionsButton}
                />
            </div>
            {object && propertiesOpen && (
                <BoardPropertiesPanel
                    key={object.id}
                    object={object}
                    disabled={disabled}
                    onChange={onChange}
                    onClose={() => {
                        setPropertiesOpen(false);
                        requestAnimationFrame(() => {
                            const target = selectionActionsButton.current
                                ?.offsetParent
                                ? selectionActionsButton.current
                                : camera.viewportRef.current;
                            target?.focus({ preventScroll: true });
                        });
                    }}
                />
            )}
        </>
    );
}
