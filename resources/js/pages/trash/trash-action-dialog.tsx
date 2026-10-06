import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import DatabaseDialog from '@/pages/databases/database-dialog';
import {
    allowDeletedTabCleanup,
    removeDeletedContentFromNavigation,
} from './trash-navigation';
import { fetchTrashData, formatStorageSize } from './trash-types';
import type { DeletionPreview, TrashSelection } from './trash-types';

export type TrashAction = {
    kind: 'delete' | 'restore';
    selection: TrashSelection;
    scopeLabel: string;
};

type Props = {
    action: TrashAction;
    onClose: () => void;
    onCompleted: () => void;
};

export function TrashActionDialog({ action, onClose, onCompleted }: Props) {
    const [preview, setPreview] = useState<DeletionPreview | null>(null);
    const [error, setError] = useState('');
    const [processing, setProcessing] = useState(false);
    const [confirmedNames, setConfirmedNames] = useState<
        Record<string, string>
    >({});
    const [restoreAncestors, setRestoreAncestors] = useState(false);
    const deleting = action.kind === 'delete';
    const workspaceEntries =
        preview?.entries.filter((entry) => entry.type === 'workspace') ?? [];
    const ancestorsRequired =
        preview?.entries.some((entry) => entry.restore_ancestors.length > 0) ??
        false;
    const canConfirm =
        preview &&
        preview.entries.length > 0 &&
        !processing &&
        (deleting
            ? workspaceEntries.every(
                  (entry) => confirmedNames[entry.workspace_id] === entry.title,
              )
            : !ancestorsRequired || restoreAncestors);

    useEffect(() => {
        const controller = new AbortController();
        void fetchTrashData<DeletionPreview>(
            '/trash/preview',
            {
                keys: action.selection.keys,
                empty_scope: action.selection.empty_scope ? '1' : '0',
                ...(action.selection.workspace_id === null
                    ? {}
                    : { workspace_id: String(action.selection.workspace_id) }),
            },
            controller.signal,
        )
            .then(setPreview)
            .catch((failure: unknown) => {
                if (!controller.signal.aborted)
                    setError(
                        failure instanceof Error
                            ? failure.message
                            : 'Could not load preview.',
                    );
            });
        return () => controller.abort();
    }, [action]);

    function confirmAction() {
        if (!canConfirm || !preview) return;
        if (deleting && !allowDeletedTabCleanup(preview)) {
            setError(
                'Finish saving the affected open documents before deleting them.',
            );
            return;
        }
        setProcessing(true);
        setError('');
        router.post(
            `/trash/${deleting ? 'delete' : 'restore'}`,
            {
                ...action.selection,
                fingerprint: preview.fingerprint,
                confirmed_names: confirmedNames,
                restore_ancestors: restoreAncestors,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    if (deleting) removeDeletedContentFromNavigation(preview);
                    toast.success(
                        deleting
                            ? 'Items permanently deleted'
                            : 'Items restored',
                    );
                    onCompleted();
                },
                onError: (errors) => setError(Object.values(errors).join(' ')),
                onFinish: () => setProcessing(false),
            },
        );
    }

    return (
        <DatabaseDialog
            open
            onClose={() => {
                if (!processing) onClose();
            }}
            title={deleting ? 'Delete permanently?' : 'Restore items?'}
            description={action.scopeLabel}
        >
            <div className="overflow-auto px-6 pb-6">
                {!preview && !error && (
                    <p role="status">Loading affected items…</p>
                )}
                {preview && (
                    <>
                        <ul className="mb-4 max-h-44 space-y-2 overflow-auto text-sm">
                            {preview.entries.map((entry) => (
                                <li key={entry.key} className="break-words">
                                    {entry.title}
                                    <span className="block text-xs text-muted-foreground">
                                        {entry.path} · {entry.descendant_count}{' '}
                                        contained items
                                    </span>
                                </li>
                            ))}
                        </ul>
                        {deleting ? (
                            <>
                                <p className="mb-3 text-sm">
                                    This permanently removes{' '}
                                    {preview.node_count} items
                                    {workspaceEntries.length > 0
                                        ? ` and ${workspaceEntries.length} workspaces`
                                        : ''}
                                    , including all descendants and separately
                                    trashed children, plus{' '}
                                    {preview.attachment_count} files (
                                    {formatStorageSize(preview.size_bytes)}).
                                    This cannot be undone. Links and mentions to
                                    these items will no longer open them.
                                </p>
                                {workspaceEntries.map((entry) => (
                                    <label
                                        key={entry.key}
                                        className="mb-3 block text-sm"
                                    >
                                        Type <strong>{entry.title}</strong> to
                                        delete this workspace
                                        <input
                                            autoComplete="off"
                                            value={
                                                confirmedNames[
                                                    entry.workspace_id
                                                ] ?? ''
                                            }
                                            onChange={(event) =>
                                                setConfirmedNames({
                                                    ...confirmedNames,
                                                    [entry.workspace_id]:
                                                        event.target.value,
                                                })
                                            }
                                            className="mt-2 w-full rounded-lg bg-accent/50 px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        />
                                    </label>
                                ))}
                            </>
                        ) : (
                            <>
                                <p className="mb-3 text-sm">
                                    Restore to the original location. Separately
                                    trashed children stay in Trash.
                                </p>
                                {ancestorsRequired && (
                                    <label className="mb-3 flex items-start gap-2 text-sm">
                                        <Checkbox
                                            checked={restoreAncestors}
                                            onCheckedChange={(checked) =>
                                                setRestoreAncestors(
                                                    checked === true,
                                                )
                                            }
                                            className="mt-1"
                                        />
                                        Restore with ancestors. This also
                                        recovers the parent folders and
                                        workspace needed to reach these items,
                                        making their other retained content
                                        visible.
                                    </label>
                                )}
                            </>
                        )}
                        {preview.entries.length === 0 && (
                            <p>This Trash scope is already empty.</p>
                        )}
                    </>
                )}
                {error && (
                    <p role="alert" className="my-3 text-sm text-destructive">
                        {error}
                    </p>
                )}
                <div className="mt-5 flex justify-end gap-2">
                    <button
                        type="button"
                        className="trash-control-button"
                        disabled={processing}
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className={`trash-control-button ${deleting ? 'text-destructive' : ''}`}
                        disabled={!canConfirm}
                        onClick={confirmAction}
                    >
                        {processing
                            ? 'Working…'
                            : deleting
                              ? 'Delete permanently'
                              : 'Restore'}
                    </button>
                </div>
            </div>
        </DatabaseDialog>
    );
}
