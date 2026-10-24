import { useState } from 'react';
import { ToolbarHighlight } from '@/components/editor/ui/toolbar-motion';
import { mountBoardToolbarMotion } from './board-toolbar-motion';
import type { BoardObject } from './board-types';
import { BoardTextStyleMenu } from './board-text-style-menu';
import { BoardTextLayoutControls } from './board-text-layout-controls';
import { Check, Pencil } from 'lucide-react';
import { BoardToolButton } from './board-tool-button';
import { BoardSelectionActions } from './board-selection-actions';
import type { BoardObjectsController } from './use-board-objects';
import type { BoardCameraController } from './use-board-camera';
import { useBoardSelectionAnchor } from './use-board-selection-anchor';
import { boardBlockLabels } from './board-block-data';
import { useBoardRecord } from './use-board-record';
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
    const toolbarRef = useBoardSelectionAnchor(
        camera,
        model.selectedIds,
        editing,
    );
    const selectedObject = useBoardRecord(
        model.store,
        model.selectedIds.length === 1 ? model.selectedIds[0] : undefined,
    );
    const [lastSelection, setLastSelection] = useState({
        selectedIds: model.selectedIds,
        object: selectedObject,
        editing,
    });
    const hasSelection = model.selectedIds.length > 0;
    if (
        hasSelection &&
        (lastSelection.selectedIds !== model.selectedIds ||
            lastSelection.object !== selectedObject ||
            lastSelection.editing !== editing)
    ) {
        //
        // Retain the actual controls through dismissal; preserving only the shell dimensions still leaves a visible More-only strip.
        //
        setLastSelection({
            selectedIds: model.selectedIds,
            object: selectedObject,
            editing,
        });
    }
    const object = hasSelection ? selectedObject : lastSelection.object;
    const selectionCount = hasSelection
        ? model.selectedIds.length
        : lastSelection.selectedIds.length;
    const toolbarEditing = hasSelection ? editing : lastSelection.editing;
    const writing =
        object &&
        ['text', 'heading', 'quote', 'callout'].includes(object.block_type);
    return (
        <>
            <div
                ref={toolbarRef}
                className="board-selection-tools board-panel orbium-editor-toolbar editor-animated-toolbar glass-surface"
                data-editing={toolbarEditing}
                role="toolbar"
                aria-orientation="horizontal"
                aria-label="Selected block actions"
                data-toolbar-positioned="false"
                data-board-editor
                hidden={!hasSelection}
                inert={!hasSelection}
            >
                <ToolbarHighlight mountReveal={mountBoardToolbarMotion} />
                {selectionCount > 1 && (
                    <span className="board-selection-label">
                        {selectionCount} selected
                    </span>
                )}
                {object && (
                    <>
                        {writing ? (
                            <>
                                <BoardTextStyleMenu
                                    object={object}
                                    disabled={disabled}
                                    onChange={onChange}
                                />
                                <BoardTextLayoutControls
                                    data={object.data}
                                    disabled={disabled}
                                    onChange={(data) =>
                                        onChange({ ...object, data })
                                    }
                                />
                            </>
                        ) : (
                            <span className="board-selection-label">
                                {
                                    boardBlockLabels[
                                        object.data.media_kind ??
                                            object.block_type
                                    ]
                                }
                            </span>
                        )}
                        {!['divider', 'drawing'].includes(
                            object.block_type,
                        ) && (
                            <BoardToolButton
                                label={
                                    toolbarEditing
                                        ? 'Finish editing'
                                        : 'Edit block'
                                }
                                icon={toolbarEditing ? Check : Pencil}
                                data-board-edit-toggle
                                data-done={toolbarEditing}
                                shortcut={
                                    toolbarEditing ? 'Ctrl/Cmd+Enter' : 'Enter'
                                }
                                disabled={busy || (disabled && !editing)}
                                onClick={() =>
                                    editing ? onFinish() : onEdit(object.id)
                                }
                            >
                                {toolbarEditing ? 'Done' : 'Edit'}
                            </BoardToolButton>
                        )}
                    </>
                )}
                <div id={`board-formatting-${boardId}`} />
                {!toolbarEditing && (
                    <BoardSelectionActions model={model} disabled={disabled} />
                )}
            </div>
        </>
    );
}
