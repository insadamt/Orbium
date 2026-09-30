import { Link, router } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowUp,
    ChevronDown,
    MoreHorizontal,
    Plus,
    RotateCcw,
    Trash2,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';

export type WorkspaceSummary = { id: number; name: string; position: number };
export type TrashedWorkspace = { id: number; name: string; deleted_at: string };

type Props = {
    workspaces: WorkspaceSummary[];
    trashedWorkspaces: TrashedWorkspace[];
    activeWorkspaceId?: number;
};
export default function WorkspacePanel({
    workspaces,
    trashedWorkspaces,
    activeWorkspaceId,
}: Props) {
    const [open, setOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editedName, setEditedName] = useState('');
    const [trashId, setTrashId] = useState<number | null>(null);
    const [manage, setManage] = useState(false);
    const activeWorkspace = workspaces.find(
        (workspace) => workspace.id === activeWorkspaceId,
    );
    function createWorkspace(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!newName.trim()) return;
        router.post(
            '/workspaces',
            { name: newName.trim() },
            {
                onSuccess: () => {
                    setNewName('');
                    setOpen(false);
                },
            },
        );
    }
    function renameWorkspace(event: FormEvent<HTMLFormElement>, id: number) {
        event.preventDefault();
        if (!editedName.trim()) return;
        router.patch(
            `/workspaces/${id}`,
            { name: editedName.trim() },
            { onSuccess: () => setEditingId(null) },
        );
    }
    return (
        <div className="relative z-10 mb-9 max-w-[980px]">
            <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpen((value) => !value)}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background/70 px-3 py-2 text-sm font-medium hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
            >
                {activeWorkspace?.name ?? 'Workspaces'}{' '}
                <ChevronDown size={15} className="text-muted-foreground" />
            </button>
            {open && (
                <div className="glass-surface absolute top-full left-0 mt-2 w-[min(360px,calc(100vw-2.5rem))] rounded-xl border border-border p-2 shadow-xl">
                    <p className="px-2 py-2 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                        Workspaces
                    </p>
                    <div className="max-h-56 overflow-y-auto">
                        {workspaces.map((workspace, index) => (
                            <div
                                key={workspace.id}
                                className={`group rounded-lg ${workspace.id === activeWorkspaceId ? 'bg-accent' : 'hover:bg-accent/60'}`}
                            >
                                {editingId === workspace.id ? (
                                    <form
                                        onSubmit={(event) =>
                                            renameWorkspace(event, workspace.id)
                                        }
                                        className="flex gap-2 p-2"
                                    >
                                        <input
                                            autoFocus
                                            aria-label="Workspace name"
                                            value={editedName}
                                            maxLength={255}
                                            onChange={(event) =>
                                                setEditedName(
                                                    event.target.value,
                                                )
                                            }
                                            className="min-w-0 flex-1 rounded border bg-background px-2 py-1 text-sm"
                                        />
                                        <button
                                            disabled={!editedName.trim()}
                                            className="text-xs font-medium disabled:opacity-40"
                                        >
                                            Save
                                        </button>
                                    </form>
                                ) : (
                                    <div className="flex items-center gap-1">
                                        <Link
                                            href={`/workspaces/${workspace.id}`}
                                            onClick={() => setOpen(false)}
                                            className="min-w-0 flex-1 truncate px-3 py-2.5 text-sm"
                                        >
                                            {workspace.name}
                                        </Link>
                                        <button
                                            aria-label={`Manage ${workspace.name}`}
                                            onClick={() =>
                                                setEditingId(workspace.id)
                                            }
                                            className="rounded p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-background focus:opacity-100"
                                        >
                                            <MoreHorizontal size={15} />
                                        </button>
                                    </div>
                                )}
                                {manage && (
                                    <div className="flex justify-end gap-2 px-2 pb-2 text-muted-foreground">
                                        <button
                                            aria-label={`Move ${workspace.name} up`}
                                            disabled={index === 0}
                                            onClick={() =>
                                                router.patch(
                                                    `/workspaces/${workspace.id}/order`,
                                                    { position: index - 1 },
                                                )
                                            }
                                            className="rounded p-1 hover:bg-background disabled:opacity-30"
                                        >
                                            <ArrowUp size={14} />
                                        </button>
                                        <button
                                            aria-label={`Move ${workspace.name} down`}
                                            disabled={
                                                index === workspaces.length - 1
                                            }
                                            onClick={() =>
                                                router.patch(
                                                    `/workspaces/${workspace.id}/order`,
                                                    { position: index + 1 },
                                                )
                                            }
                                            className="rounded p-1 hover:bg-background disabled:opacity-30"
                                        >
                                            <ArrowDown size={14} />
                                        </button>
                                        <button
                                            aria-label={`Trash ${workspace.name}`}
                                            onClick={() =>
                                                setTrashId(workspace.id)
                                            }
                                            className="rounded p-1 text-destructive hover:bg-background"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )}
                                {trashId === workspace.id && (
                                    <div className="space-y-2 border-t border-border p-3 text-xs">
                                        <p>
                                            Move “{workspace.name}” and its
                                            content to Trash?
                                        </p>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setTrashId(null)}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                className="font-medium text-destructive"
                                                onClick={() =>
                                                    router.delete(
                                                        `/workspaces/${workspace.id}`,
                                                    )
                                                }
                                            >
                                                Move to Trash
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <form
                        onSubmit={createWorkspace}
                        className="mt-2 flex gap-2 border-t border-border px-2 pt-3"
                    >
                        <input
                            aria-label="New workspace name"
                            value={newName}
                            onChange={(event) => setNewName(event.target.value)}
                            maxLength={255}
                            placeholder="New workspace"
                            className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 text-sm"
                        />
                        <button
                            type="submit"
                            aria-label="Create workspace"
                            disabled={!newName.trim()}
                            className="rounded-lg bg-foreground px-3 py-2 text-background disabled:opacity-40"
                        >
                            <Plus size={16} />
                        </button>
                    </form>
                    <button
                        onClick={() => setManage((value) => !value)}
                        className="mt-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent"
                    >
                        {manage ? 'Done managing' : 'Manage workspaces'}
                    </button>
                    {manage && trashedWorkspaces.length > 0 && (
                        <div className="mt-2 border-t border-border px-2 pt-2">
                            <p className="text-xs text-muted-foreground">
                                Deleted workspaces
                            </p>
                            {trashedWorkspaces.map((workspace) => (
                                <div
                                    key={workspace.id}
                                    className="flex items-center justify-between gap-2 py-1.5 text-sm"
                                >
                                    <span className="truncate">
                                        {workspace.name}
                                    </span>
                                    <button
                                        aria-label={`Restore ${workspace.name}`}
                                        onClick={() =>
                                            router.post(
                                                `/workspaces/${workspace.id}/restore`,
                                            )
                                        }
                                        className="rounded p-1 hover:bg-accent"
                                    >
                                        <RotateCcw size={15} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
