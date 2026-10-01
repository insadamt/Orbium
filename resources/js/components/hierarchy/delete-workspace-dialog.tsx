import { router } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/navigation/navigation-dialog';
import { useNavigation } from '@/components/navigation/navigation-store';
import type { WorkspaceSummary } from './workspace-panel';

type Props = {
    workspace: Pick<WorkspaceSummary, 'id' | 'name'> | null;
    onClose: () => void;
    onDeleted: () => void;
};

export function DeleteWorkspaceDialog({
    workspace,
    onClose,
    onDeleted,
}: Props) {
    const [confirmedName, setConfirmedName] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    function closeDialog() {
        setConfirmedName('');
        setError('');
        onClose();
    }

    function deleteWorkspace(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!workspace || confirmedName !== workspace.name || saving) return;

        setSaving(true);
        setError('');
        router.delete(`/workspaces/${workspace.id}/permanent`, {
            data: { confirmed_name: confirmedName },
            onSuccess: () => {
                useNavigation.getState().forgetWorkspace(workspace.id);
                try {
                    if (
                        localStorage.getItem('orbium.lastWorkspaceId') ===
                        String(workspace.id)
                    ) {
                        localStorage.removeItem('orbium.lastWorkspaceId');
                    }
                } catch {
                    // Navigation still succeeds when browser storage is unavailable.
                }
                closeDialog();
                onDeleted();
            },
            onError: (errors) => {
                setError(
                    Object.values(errors)[0] ??
                        'Could not delete the workspace.',
                );
            },
            onFinish: () => setSaving(false),
        });
    }

    return (
        <Dialog
            open={workspace !== null}
            onOpenChange={(open) => !open && closeDialog()}
        >
            <DialogContent className="max-w-md gap-4 border-border/60 p-6">
                <DialogTitle className="pr-7 text-lg font-semibold tracking-tight">
                    Delete “{workspace?.name}” permanently?
                </DialogTitle>
                {workspace && (
                    <form onSubmit={deleteWorkspace} className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            This permanently deletes its folders, documents,
                            databases, attachments, and related workspace data.
                            This action cannot be undone.
                        </p>
                        <label
                            className="block text-sm font-medium"
                            htmlFor="workspace-delete-name"
                        >
                            Type “{workspace.name}” to confirm:
                        </label>
                        <input
                            id="workspace-delete-name"
                            autoFocus
                            autoComplete="off"
                            spellCheck={false}
                            value={confirmedName}
                            onChange={(event) =>
                                setConfirmedName(event.target.value)
                            }
                            className="w-full rounded-xl border border-border/70 bg-background px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                        {error && (
                            <p
                                role="alert"
                                className="text-sm text-destructive"
                            >
                                {error}
                            </p>
                        )}
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={closeDialog}
                                disabled={saving}
                                className="rounded-lg px-4 py-2 text-sm hover:bg-accent"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={
                                    saving || confirmedName !== workspace.name
                                }
                                className="rounded-lg bg-destructive px-4 py-2 text-sm text-white disabled:opacity-40"
                            >
                                {saving ? 'Deleting…' : 'Delete permanently'}
                            </button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
