import { Link, router } from '@inertiajs/react';
import { ArrowDown, ArrowUp, RotateCcw, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';

export type WorkspaceSummary = { id: number; name: string; position: number };
export type TrashedWorkspace = { id: number; name: string; deleted_at: string };

type WorkspacePanelProps = {
    workspaces: WorkspaceSummary[];
    trashedWorkspaces: TrashedWorkspace[];
    activeWorkspaceId?: number;
};

export default function WorkspacePanel({
    workspaces,
    trashedWorkspaces,
    activeWorkspaceId,
}: WorkspacePanelProps) {
    const [newName, setNewName] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editedName, setEditedName] = useState('');

    function createWorkspace(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        router.post(
            '/workspaces',
            { name: newName.trim() },
            {
                onSuccess: () => setNewName(''),
            },
        );
    }

    function renameWorkspace(
        event: FormEvent<HTMLFormElement>,
        id: number,
    ): void {
        event.preventDefault();
        router.patch(
            `/workspaces/${id}`,
            { name: editedName.trim() },
            {
                onSuccess: () => setEditingId(null),
            },
        );
    }

    function deleteWorkspace(workspace: WorkspaceSummary): void {
        if (
            window.confirm(`Move “${workspace.name}” and its content to Trash?`)
        ) {
            router.delete(`/workspaces/${workspace.id}`);
        }
    }

    return (
        <aside className="glass-surface rounded-2xl border border-border p-5 lg:w-72 lg:shrink-0">
            <h2 className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                Workspaces
            </h2>
            <div className="mt-4 space-y-2">
                {workspaces.map((workspace, index) => (
                    <div
                        key={workspace.id}
                        className={`rounded-xl border p-3 ${workspace.id === activeWorkspaceId ? 'border-foreground/40 bg-background/70' : 'border-border/60'}`}
                    >
                        {editingId === workspace.id ? (
                            <form
                                onSubmit={(event) =>
                                    renameWorkspace(event, workspace.id)
                                }
                                className="flex gap-2"
                            >
                                <input
                                    aria-label="Workspace name"
                                    value={editedName}
                                    onChange={(event) =>
                                        setEditedName(event.target.value)
                                    }
                                    maxLength={255}
                                    className="min-w-0 flex-1 rounded-md border bg-background px-2 py-1 text-sm"
                                />
                                <button
                                    type="submit"
                                    className="text-xs font-medium"
                                >
                                    Save
                                </button>
                            </form>
                        ) : (
                            <Link
                                href={`/workspaces/${workspace.id}`}
                                className="block truncate text-sm font-medium hover:underline"
                            >
                                {workspace.name}
                            </Link>
                        )}
                        <div className="mt-2 flex flex-wrap gap-1 text-xs text-muted-foreground">
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingId(workspace.id);
                                    setEditedName(workspace.name);
                                }}
                                className="rounded px-1 hover:bg-accent"
                            >
                                Rename
                            </button>
                            <button
                                type="button"
                                disabled={index === 0}
                                onClick={() =>
                                    router.patch(
                                        `/workspaces/${workspace.id}/order`,
                                        { position: index - 1 },
                                    )
                                }
                                aria-label={`Move ${workspace.name} up`}
                                className="rounded px-1 hover:bg-accent disabled:opacity-30"
                            >
                                <ArrowUp size={13} />
                            </button>
                            <button
                                type="button"
                                disabled={index === workspaces.length - 1}
                                onClick={() =>
                                    router.patch(
                                        `/workspaces/${workspace.id}/order`,
                                        { position: index + 1 },
                                    )
                                }
                                aria-label={`Move ${workspace.name} down`}
                                className="rounded px-1 hover:bg-accent disabled:opacity-30"
                            >
                                <ArrowDown size={13} />
                            </button>
                            <button
                                type="button"
                                onClick={() => deleteWorkspace(workspace)}
                                aria-label={`Trash ${workspace.name}`}
                                className="rounded px-1 text-destructive hover:bg-accent"
                            >
                                <Trash2 size={13} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <form onSubmit={createWorkspace} className="mt-5 flex gap-2">
                <input
                    aria-label="New workspace name"
                    value={newName}
                    onChange={(event) => setNewName(event.target.value)}
                    placeholder="New workspace"
                    maxLength={255}
                    className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-sm"
                />
                <button
                    type="submit"
                    disabled={!newName.trim()}
                    className="rounded-md bg-foreground px-3 py-2 text-xs font-medium text-background disabled:opacity-40"
                >
                    Create
                </button>
            </form>
            {trashedWorkspaces.length > 0 && (
                <section className="mt-7 border-t border-border pt-4">
                    <h3 className="text-xs font-semibold text-muted-foreground">
                        Deleted workspaces
                    </h3>
                    {trashedWorkspaces.map((workspace) => (
                        <div
                            key={workspace.id}
                            className="mt-3 flex items-center justify-between gap-2 text-sm"
                        >
                            <span className="truncate">{workspace.name}</span>
                            <button
                                type="button"
                                onClick={() =>
                                    router.post(
                                        `/workspaces/${workspace.id}/restore`,
                                    )
                                }
                                aria-label={`Restore ${workspace.name}`}
                                className="rounded p-1 hover:bg-accent"
                            >
                                <RotateCcw size={15} />
                            </button>
                        </div>
                    ))}
                </section>
            )}
        </aside>
    );
}
