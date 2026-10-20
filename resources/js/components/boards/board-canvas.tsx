import { useBoardBlockEditing } from './use-board-block-editing';
import { useBoardResourceLocks } from './use-board-resource-locks';
import { useBoardResourceActions } from './use-board-resource-actions';
import { BoardResourcePicker } from './board-resource-picker';
import { BoardResourcePreviews } from './board-resource-previews';
import { useCallback, useMemo, useRef, useState } from 'react';
import { BoardHelpDialog } from './board-help-dialog';
import { BoardContextMenu } from './board-context-menu';
import { useBoardTools } from './use-board-tools';
import { handleBoardEscape } from './board-escape';
import { handleBoardHistoryKeyboard } from './board-history-keyboard';
import { BoardObjectCard } from './board-object-card';
import { BoardToolbar } from './board-toolbar';
import { BoardSaveStatus } from './board-save-status';
import { useBoardAutosave } from './use-board-autosave';
import { useBoardObjects } from './use-board-objects';
import { useBoardCamera } from './use-board-camera';
import { useBoardPointer } from './use-board-pointer';
import { type BoardLocation, type BoardSnapshot } from './board-types';
import { boardKeyboardHandler } from './board-keyboard';
import { useBoardRenderedObjects } from './use-board-rendered-objects';
import './board.css';
import './board-chrome.css';
import './board-blocks.css';
import './board-resource.css';
import './board-workspace.css';
import './board-object-design.css';
import './board-interaction-polish.css';
import './board-block-presentation.css';
import './board-resource-container.css';
import './board-editing.css';
import './board-toolbar-polish.css';
import './board-contextual-toolbars.css';
import { useBoardClipboard } from './use-board-clipboard';
import { readBoardSnapshot } from './board-api';
import { downloadBoardDraft } from './board-recovery';
import { boardBlockLabels } from './board-block-data';
import { BoardSelectionBounds } from './board-selection-bounds';
import { BoardSelectionTools } from './board-selection-tools';

export function BoardCanvas(
    props: BoardLocation & {
        tabId: string;
        snapshot: BoardSnapshot;
        toolbarHost: HTMLDivElement | null;
    },
) {
    const result = useMemo(() => {
        try {
            return { snapshot: readBoardSnapshot(props.snapshot) };
        } catch (error) {
            return {
                error:
                    error instanceof Error
                        ? error.message
                        : 'Board data unavailable.',
            };
        }
    }, [props.snapshot]);
    if (!result.snapshot)
        return (
            <div className="rounded-xl border p-6">
                <p role="alert">{result.error}</p>
                <button
                    type="button"
                    onClick={() =>
                        downloadBoardDraft(
                            JSON.stringify(props.snapshot, null, 2),
                        )
                    }
                >
                    Download original Board data
                </button>
            </div>
        );
    return (
        <BoardResourcePreviews location={props}>
            <BoardWorkspace {...props} snapshot={result.snapshot} />
        </BoardResourcePreviews>
    );
}

function BoardWorkspace({
    workspaceId,
    boardId,
    tabId,
    snapshot,
    toolbarHost,
}: BoardLocation & {
    tabId: string;
    snapshot: BoardSnapshot;
    toolbarHost: HTMLDivElement | null;
}) {
    const location = useMemo(
        () => ({ workspaceId, boardId }),
        [workspaceId, boardId],
    );
    const recoveryLocation = useMemo(
        () => ({ ...location, tabId }),
        [location, tabId],
    );
    const resourceLocks = useBoardResourceLocks();
    const resourceLockedRef = resourceLocks.lockedRef;
    const resourceLocked = resourceLocks.locked;
    const composingRef = useRef(false);
    const uploadingRef = useRef(false);
    const [uploading, setUploading] = useState(false);
    const save = useBoardAutosave(
        recoveryLocation,
        snapshot,
        () =>
            composingRef.current ||
            uploadingRef.current ||
            resourceLocks.isDocumentLocked(),
        () => resourceLockedRef.current,
    );
    const model = useBoardObjects(
        save.startingSnapshot.objects,
        save.queueSave,
    );
    const camera = useBoardCamera(location);
    const tools = useBoardTools({
        model,
        camera,
        isLocked: () =>
            save.blocked ||
            composingRef.current ||
            uploadingRef.current ||
            resourceLockedRef.current,
    });
    const pointer = useBoardPointer(
        model,
        camera,
        save.blocked,
        () =>
            composingRef.current ||
            uploadingRef.current ||
            resourceLockedRef.current,
        { tool: tools.tool, onPlace: tools.placeBlock },
    );
    const clipboard = useBoardClipboard(
        model,
        location,
        camera.centerPoint,
        save.blocked || uploading || resourceLocked,
    );
    const [helpOpen, setHelpOpen] = useState(false);
    const activeModel = useRef(model);
    activeModel.current = model;
    const viewportRef = camera.viewportRef;

    const finishEditing = useCallback(() => {
        if (
            composingRef.current ||
            uploadingRef.current ||
            resourceLockedRef.current
        )
            return;
        activeModel.current.finishEditing();
        viewportRef.current?.focus({ preventScroll: true });
    }, [viewportRef]);
    const beginEditing = useCallback((id: string) => {
        if (
            activeModel.current.objectsRef.current.find(
                (object) => object.id === id,
            )?.block_type === 'divider'
        )
            return;
        if (
            composingRef.current ||
            uploadingRef.current ||
            resourceLockedRef.current
        )
            return;
        activeModel.current.select([id]);
        activeModel.current.setEditingId(id);
    }, []);
    const selectFocusedObject = useCallback((id: string) => {
        if (
            composingRef.current ||
            uploadingRef.current ||
            resourceLockedRef.current
        )
            return;
        activeModel.current.finishEditing();
        activeModel.current.select([id]);
    }, []);
    const {
        updateBlockContent,
        updateBlockObject,
        updateContentHeight,
        breakHistoryGroup,
        transformBlock,
    } = useBoardBlockEditing(activeModel);
    const updateComposition = useCallback((composing: boolean) => {
        composingRef.current = composing;
    }, []);
    const updateUploading = useCallback((busy: boolean) => {
        uploadingRef.current = busy;
        setUploading(busy);
    }, []);
    const resources = useBoardResourceActions(
        location,
        model,
        camera,
        save,
        resourceLocks.setCreationLocked,
        () => uploadingRef.current || resourceLockedRef.current,
    );
    const renderedObjects = useBoardRenderedObjects(
        model.objects,
        camera.visibleBounds,
        model.editingId,
    );
    return (
        <section
            className="board-workspace"
            data-editing={Boolean(model.editingId)}
            aria-label="Board workspace"
            onKeyDownCapture={(event) => {
                if (
                    handleBoardHistoryKeyboard(
                        event,
                        model,
                        save.blocked ||
                            composingRef.current ||
                            uploadingRef.current ||
                            resourceLockedRef.current,
                    )
                )
                    return;
                handleBoardEscape(event, {
                    isLocked: () =>
                        composingRef.current ||
                        uploadingRef.current ||
                        resourceLockedRef.current,
                    cancelGesture: pointer.cancel,
                    cancelTool: tools.cancelTool,
                    editing: Boolean(model.editingId),
                    finishEditing,
                });
            }}
        >
            <div
                className="board-stage"
                data-editing={Boolean(model.editingId)}
            >
                <BoardSaveStatus
                    save={save}
                    uploading={uploading || resourceLocked}
                    busyLabel={
                        uploading
                            ? 'Uploading media…'
                            : resourceLocked
                              ? 'Saving or opening linked Document…'
                              : undefined
                    }
                    onLoaded={(latest) => {
                        pointer.cancel();
                        model.reset(latest.objects);
                    }}
                />
                <BoardContextMenu
                    model={model}
                    camera={camera}
                    tool={tools.tool}
                    disabled={save.blocked || uploading || resourceLocked}
                    onChooseTool={(tool) => {
                        pointer.cancel();
                        tools.chooseTool(tool);
                    }}
                    onEdit={beginEditing}
                    onCancelGesture={pointer.cancel}
                >
                    <div
                        ref={viewportRef}
                        className="board-canvas"
                        data-tool={tools.tool}
                        data-placing={tools.placing}
                        tabIndex={0}
                        role="region"
                        aria-label="Board canvas"
                        aria-describedby="board-canvas-help"
                        onPointerDown={pointer.onPointerDown}
                        onPointerMove={pointer.onPointerMove}
                        onPointerUp={pointer.onPointerUp}
                        onPointerCancel={pointer.onPointerCancel}
                        onLostPointerCapture={pointer.onLostPointerCapture}
                        onKeyDown={(event) => {
                            if (tools.handleToolKeyboard(event)) return;
                            boardKeyboardHandler(
                                model,
                                pointer,
                                beginEditing,
                                save.blocked,
                                () =>
                                    uploadingRef.current ||
                                    resourceLockedRef.current,
                            )(event);
                        }}
                        {...clipboard}
                    >
                        <div
                            ref={camera.gridLayerRef}
                            className="board-grid"
                            aria-hidden="true"
                        />
                        <div
                            ref={camera.worldRef}
                            className="board-world"
                            data-multi-selection={model.selectedIds.length > 1}
                        >
                            <BoardSelectionBounds
                                objects={model.objects}
                                selectedIds={model.selectedIds}
                            />
                            <div
                                ref={pointer.guidesRef}
                                className="board-alignment-guides"
                                aria-hidden="true"
                            />
                            {renderedObjects.map((object) => (
                                <BoardObjectCard
                                    key={object.id}
                                    object={object}
                                    location={location}
                                    tabId={tabId}
                                    onResourceLock={resourceLocks.setCardLocked}
                                    selected={model.selectedIds.includes(
                                        object.id,
                                    )}
                                    editing={model.editingId === object.id}
                                    blocked={
                                        save.blocked ||
                                        (object.id !== model.editingId &&
                                            (uploading || resourceLocked))
                                    }
                                    editorResetVersion={
                                        model.editorResetVersion
                                    }
                                    onComposition={updateComposition}
                                    onUploading={updateUploading}
                                    onSelect={selectFocusedObject}
                                    onEdit={beginEditing}
                                    onFinish={finishEditing}
                                    onChange={updateBlockContent}
                                    onObjectChange={updateBlockObject}
                                    editPoint={model.editPoint}
                                    onTransform={transformBlock}
                                    onHeightChange={updateContentHeight}
                                    onHistoryBoundary={breakHistoryGroup}
                                />
                            ))}
                        </div>
                        <div
                            ref={pointer.marqueeRef}
                            className="board-selection-box"
                            hidden
                        />
                        {!model.objects.length && (
                            <div className="board-empty-state">
                                <span>
                                    Choose Text or Add, then click anywhere to
                                    begin.
                                </span>
                            </div>
                        )}
                    </div>
                </BoardContextMenu>
                {tools.placementKind && (
                    <div
                        className="board-placement-hint board-panel glass-surface"
                        role="status"
                    >
                        <span>
                            Click to place{' '}
                            {boardBlockLabels[
                                tools.placementKind
                            ].toLowerCase()}{' '}
                            · Enter for center
                        </span>
                        <button
                            type="button"
                            onClick={tools.cancelTool}
                            aria-label="Cancel placement"
                        >
                            Cancel <kbd>Esc</kbd>
                        </button>
                    </div>
                )}
                <BoardToolbar
                    toolbarHost={toolbarHost}
                    editing={Boolean(model.editingId)}
                    model={model}
                    camera={camera}
                    blocked={save.blocked || uploading || resourceLocked}
                    onResource={() => {
                        pointer.cancel();
                        tools.cancelTool();
                        resources.openPicker();
                    }}
                    tool={tools.tool}
                    onChooseTool={(tool) => {
                        pointer.cancel();
                        tools.chooseTool(tool);
                    }}
                    onHelp={() => setHelpOpen(true)}
                    onUndo={() => {
                        if (
                            !save.blocked &&
                            !composingRef.current &&
                            !uploadingRef.current &&
                            !resourceLockedRef.current
                        )
                            model.undo();
                    }}
                    onRedo={() => {
                        if (
                            !save.blocked &&
                            !composingRef.current &&
                            !uploadingRef.current &&
                            !resourceLockedRef.current
                        )
                            model.redo();
                    }}
                />
                <BoardSelectionTools
                    boardId={boardId}
                    model={model}
                    camera={camera}
                    editing={Boolean(model.editingId)}
                    disabled={save.blocked || uploading || resourceLocked}
                    busy={uploading || resourceLocked}
                    onEdit={beginEditing}
                    onFinish={finishEditing}
                    onChange={(object) =>
                        model.commit(
                            model.objectsRef.current.map((item) =>
                                item.id === object.id ? object : item,
                            ),
                        )
                    }
                />
            </div>
            <p id="board-canvas-help" className="sr-only">
                Choose Select to move objects or Hand to pan. Choose a block
                tool, then click to place it. Double-click a block to edit;
                Escape cancels placement or editing.
            </p>
            <BoardResourcePicker
                location={location}
                open={resources.open}
                onClose={resources.close}
                onInsert={resources.insert}
                onCreate={resources.create}
                pendingTitle={resources.pendingTitle}
            />
            <BoardHelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
        </section>
    );
}
