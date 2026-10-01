import { router } from '@inertiajs/react';
import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { DeleteWorkspaceDialog } from './delete-workspace-dialog';
import { TrashedWorkspaces } from './trashed-workspaces';
import { WorkspaceRow } from './workspace-row';

export type WorkspaceSummary = { id: number; name: string; position: number };
export type TrashedWorkspace = { id: number; name: string; deleted_at: string };

type Props = {
    workspaces: WorkspaceSummary[];
    trashedWorkspaces: TrashedWorkspace[];
};

export default function WorkspacePanel({
    workspaces,
    trashedWorkspaces,
}: Props) {
    const [orderedWorkspaces, setOrderedWorkspaces] = useState(workspaces);
    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editedName, setEditedName] = useState('');
    const [trashId, setTrashId] = useState<number | null>(null);
    const [deleteCandidate, setDeleteCandidate] =
        useState<TrashedWorkspace | null>(null);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');
    const newWorkspaceInput = useRef<HTMLInputElement>(null);
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    useEffect(() => setOrderedWorkspaces(workspaces), [workspaces]);
    useEffect(() => {
        if (creating) newWorkspaceInput.current?.focus();
    }, [creating]);

    function createWorkspace(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!newName.trim() || processing) return;
        setProcessing(true);
        setError('');
        router.post(
            '/workspaces',
            { name: newName.trim(), return_to_settings: true },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setCreating(false);
                    setNewName('');
                },
                onError: (errors) =>
                    setError(
                        Object.values(errors)[0] ??
                            'Could not create the workspace.',
                    ),
                onFinish: () => setProcessing(false),
            },
        );
    }

    function renameWorkspace(
        event: FormEvent<HTMLFormElement>,
        workspaceId: number,
    ) {
        event.preventDefault();
        if (!editedName.trim() || processing) return;
        setProcessing(true);
        setError('');
        router.patch(
            `/workspaces/${workspaceId}`,
            { name: editedName.trim() },
            {
                preserveScroll: true,
                onSuccess: () => setEditingId(null),
                onError: (errors) =>
                    setError(
                        Object.values(errors)[0] ??
                            'Could not rename the workspace.',
                    ),
                onFinish: () => setProcessing(false),
            },
        );
    }

    function trashWorkspace(workspaceId: number) {
        if (processing) return;
        setProcessing(true);
        setError('');
        router.delete(`/workspaces/${workspaceId}`, {
            preserveScroll: true,
            onSuccess: () => setTrashId(null),
            onError: (errors) =>
                setError(
                    Object.values(errors)[0] ??
                        'Could not move the workspace to Trash.',
                ),
            onFinish: () => setProcessing(false),
        });
    }

    function reorderWorkspaces(event: DragEndEvent) {
        if (!event.over || event.active.id === event.over.id || processing)
            return;
        const sourceIndex = orderedWorkspaces.findIndex(
            (workspace) => workspace.id === event.active.id,
        );
        const targetIndex = orderedWorkspaces.findIndex(
            (workspace) => workspace.id === event.over?.id,
        );
        if (sourceIndex < 0 || targetIndex < 0) return;
        const nextOrder = arrayMove(
            orderedWorkspaces,
            sourceIndex,
            targetIndex,
        );
        setOrderedWorkspaces(nextOrder);
        setProcessing(true);
        setError('');
        router.patch(
            `/workspaces/${event.active.id}/order`,
            { position: targetIndex },
            {
                preserveScroll: true,
                onError: (errors) => {
                    setOrderedWorkspaces(orderedWorkspaces);
                    setError(
                        Object.values(errors)[0] ??
                            'Could not save the workspace order.',
                    );
                },
                onFinish: () => setProcessing(false),
            },
        );
    }

    function restoreWorkspace(workspaceId: number) {
        if (processing) return;
        setProcessing(true);
        setError('');
        router.post(
            `/workspaces/${workspaceId}/restore`,
            {},
            {
                preserveScroll: true,
                onError: (errors) =>
                    setError(
                        Object.values(errors)[0] ??
                            'Could not restore the workspace.',
                    ),
                onFinish: () => setProcessing(false),
            },
        );
    }

    return (
        <div className="workspace-manager">
            <header className="workspace-manager-header">
                <div>
                    <h2>Workspaces</h2>
                    <p>Create and organize your workspaces in one place.</p>
                </div>
                <button
                    type="button"
                    className="workspace-manager-primary"
                    aria-expanded={creating}
                    onClick={() => {
                        setCreating(true);
                        setError('');
                    }}
                >
                    <Plus size={17} aria-hidden="true" /> New workspace
                </button>
            </header>

            <div className="workspace-create-slot" data-open={creating}>
                <form
                    onSubmit={createWorkspace}
                    onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                            setCreating(false);
                            setNewName('');
                            setError('');
                        }
                    }}
                >
                    <label className="sr-only" htmlFor="new-workspace-name">
                        Workspace name
                    </label>
                    <input
                        id="new-workspace-name"
                        ref={newWorkspaceInput}
                        tabIndex={creating ? 0 : -1}
                        value={newName}
                        onChange={(event) => setNewName(event.target.value)}
                        maxLength={255}
                        placeholder="Workspace name"
                    />
                    <button
                        type="submit"
                        disabled={processing || !newName.trim()}
                    >
                        Create
                    </button>
                    <button
                        type="button"
                        className="workspace-create-cancel"
                        onClick={() => {
                            setCreating(false);
                            setNewName('');
                            setError('');
                        }}
                    >
                        Cancel
                    </button>
                </form>
            </div>
            {error && (
                <p role="alert" className="workspace-manager-error">
                    {error}
                </p>
            )}

            <section
                aria-labelledby="your-workspaces-heading"
                className="workspace-manager-list"
            >
                <div className="workspace-manager-section-heading">
                    <h3 id="your-workspaces-heading">Your workspaces</h3>
                    <span>{orderedWorkspaces.length}</span>
                </div>
                {orderedWorkspaces.length === 0 ? (
                    <p className="workspace-manager-empty">
                        No workspaces yet. Create one to get started.
                    </p>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={reorderWorkspaces}
                    >
                        <SortableContext
                            items={orderedWorkspaces.map(
                                (workspace) => workspace.id,
                            )}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="workspace-manager-rows">
                                {orderedWorkspaces.map((workspace) => (
                                    <WorkspaceRow
                                        key={workspace.id}
                                        workspace={workspace}
                                        editing={editingId === workspace.id}
                                        editedName={editedName}
                                        trashConfirmationOpen={
                                            trashId === workspace.id
                                        }
                                        processing={processing}
                                        onEditedNameChange={setEditedName}
                                        onRenameSubmit={(event) =>
                                            renameWorkspace(event, workspace.id)
                                        }
                                        onRename={() => {
                                            setEditingId(workspace.id);
                                            setEditedName(workspace.name);
                                            setTrashId(null);
                                        }}
                                        onCancelRename={() =>
                                            setEditingId(null)
                                        }
                                        onRequestTrash={() => {
                                            setTrashId(workspace.id);
                                            setEditingId(null);
                                        }}
                                        onCancelTrash={() => setTrashId(null)}
                                        onConfirmTrash={() =>
                                            trashWorkspace(workspace.id)
                                        }
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}
            </section>

            <TrashedWorkspaces
                workspaces={trashedWorkspaces}
                processing={processing}
                onRestore={restoreWorkspace}
                onDelete={setDeleteCandidate}
            />
            <DeleteWorkspaceDialog
                workspace={deleteCandidate}
                onClose={() => setDeleteCandidate(null)}
                onDeleted={() => setDeleteCandidate(null)}
            />
        </div>
    );
}
