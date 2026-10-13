import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useRef, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import {
    formatLibrarySize,
    libraryRequest,
    type LibraryFile,
    type LibraryFileDetails,
} from './library-api';

export type LibraryAction = (
    | { kind: 'rename'; file: LibraryFile }
    | { kind: 'delete'; files: LibraryFile[] }
) & { returnFocusTo?: HTMLElement };
export type LibraryActionResult =
    | { kind: 'rename'; id: number; name: string }
    | { kind: 'delete'; ids: number[] };

export function LibraryActionDialog({
    workspaceId,
    action,
    onClose,
    onSuccess,
}: {
    workspaceId: number;
    action: LibraryAction;
    onClose: () => void;
    onSuccess: (result: LibraryActionResult) => void;
}) {
    const [name, setName] = useState(
        action.kind === 'rename' ? action.file.name : '',
    );
    const [details, setDetails] = useState<LibraryFileDetails[]>([]);
    const [loading, setLoading] = useState(action.kind === 'delete');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [retry, setRetry] = useState(0);
    const returnFocus = useRef(
        action.returnFocusTo ?? (document.activeElement as HTMLElement | null),
    );
    const base = `/workspaces/${workspaceId}/library`;
    useEffect(() => {
        if (action.kind !== 'delete') return;
        const controller = new AbortController();
        setLoading(true);
        setError('');
        libraryRequest<{ files: LibraryFileDetails[] }>(`${base}/selection`, {
            method: 'POST',
            signal: controller.signal,
            body: JSON.stringify({ ids: action.files.map((file) => file.id) }),
        })
            .then((result) => {
                if (!controller.signal.aborted) setDetails(result.files);
            })
            .catch((failure: Error) => {
                if (!controller.signal.aborted) setError(failure.message);
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        return () => controller.abort();
    }, [action, base, retry]);
    const used = details.filter((file) => file.usage.length > 0);
    async function submit() {
        setBusy(true);
        setError('');
        try {
            if (action.kind === 'rename') {
                const result = await libraryRequest<{ name: string }>(
                    `${base}/files/${action.file.id}`,
                    { method: 'PATCH', body: JSON.stringify({ name }) },
                );
                onSuccess({
                    kind: 'rename',
                    id: action.file.id,
                    name: result.name,
                });
            } else {
                const result = await libraryRequest<{ deleted: number[] }>(
                    `${base}/delete`,
                    {
                        method: 'POST',
                        body: JSON.stringify({
                            ids: action.files.map((file) => file.id),
                            confirmed: true,
                        }),
                    },
                );
                onSuccess({ kind: 'delete', ids: result.deleted });
            }
        } catch (failure) {
            setError(
                failure instanceof Error
                    ? failure.message
                    : 'Could not update the Library.',
            );
            if (action.kind === 'delete') setDetails([]);
        } finally {
            setBusy(false);
        }
    }
    return (
        <Dialog.Root
            open
            onOpenChange={(open) => {
                if (!open && !busy) onClose();
            }}
        >
            <Dialog.Portal>
                <Dialog.Overlay className="library-dialog-overlay" />
                <Dialog.Content
                    className="library-action-dialog"
                    onEscapeKeyDown={(event) => {
                        if (busy) event.preventDefault();
                    }}
                    onPointerDownOutside={(event) => {
                        if (busy) event.preventDefault();
                    }}
                    onCloseAutoFocus={(event) => {
                        event.preventDefault();
                        if (returnFocus.current?.isConnected)
                            returnFocus.current.focus();
                        else
                            document
                                .querySelector<HTMLButtonElement>(
                                    '[aria-label="Refresh Library"]',
                                )
                                ?.focus();
                    }}
                >
                    <Dialog.Title className="text-lg font-semibold">
                        {action.kind === 'rename'
                            ? 'Rename file'
                            : used.length
                              ? 'Files are still used'
                              : `Delete ${action.files.length === 1 ? 'file' : `${action.files.length} files`}?`}
                    </Dialog.Title>
                    <Dialog.Description className="text-sm text-muted-foreground">
                        {action.kind === 'rename'
                            ? 'Change the Library and download filename. Existing page captions stay as written.'
                            : used.length
                              ? 'Remove these references first. Content in Trash also counts as usage. No files will be deleted.'
                              : 'Only unused files can be deleted. Permanent deletion cannot be undone.'}
                    </Dialog.Description>
                    <button
                        type="button"
                        aria-label="Close dialog"
                        className="library-dialog-close"
                        disabled={busy}
                        onClick={onClose}
                    >
                        <X size={18} />
                    </button>
                    {action.kind === 'rename' ? (
                        <form
                            id="library-rename-form"
                            onSubmit={(event) => {
                                event.preventDefault();
                                void submit();
                            }}
                        >
                            <label className="block space-y-2 text-sm">
                                Filename
                                <input
                                    autoFocus
                                    value={name}
                                    maxLength={255}
                                    onChange={(event) =>
                                        setName(event.target.value)
                                    }
                                    className="library-text-input"
                                />
                            </label>
                        </form>
                    ) : loading ? (
                        <p
                            role="status"
                            className="flex items-center gap-2 py-6 text-sm text-muted-foreground"
                        >
                            <Loader2
                                size={16}
                                className="motion-safe:animate-spin"
                            />{' '}
                            Checking saved usage…
                        </p>
                    ) : (
                        <div className="max-h-72 space-y-3 overflow-y-auto py-2">
                            {(details.length ? details : action.files).map(
                                (file) => (
                                    <div
                                        key={file.id}
                                        className="rounded-xl bg-muted/40 p-3"
                                    >
                                        <p className="truncate text-sm font-medium">
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatLibrarySize(file.size_bytes)}
                                        </p>
                                        {'usage' in file &&
                                            (
                                                file as LibraryFileDetails
                                            ).usage.map((usage) => (
                                                <a
                                                    key={usage.id}
                                                    href={usage.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="mt-2 block truncate text-sm underline"
                                                >
                                                    {usage.title}
                                                    {usage.trashed
                                                        ? ' (Trash)'
                                                        : ''}
                                                </a>
                                            ))}
                                    </div>
                                ),
                            )}
                        </div>
                    )}
                    {error && (
                        <p role="alert" className="text-sm text-destructive">
                            {error}
                        </p>
                    )}
                    <div className="mt-2 flex justify-end gap-2">
                        <button
                            type="button"
                            className="library-button"
                            disabled={busy}
                            onClick={onClose}
                        >
                            {used.length ? 'Close' : 'Cancel'}
                        </button>
                        {action.kind === 'delete' &&
                            error &&
                            !details.length && (
                                <button
                                    type="button"
                                    className="library-button"
                                    disabled={busy || loading}
                                    onClick={() =>
                                        setRetry((value) => value + 1)
                                    }
                                >
                                    Review again
                                </button>
                            )}
                        {action.kind === 'rename' ? (
                            <button
                                form="library-rename-form"
                                className="library-button library-button-primary"
                                disabled={
                                    busy ||
                                    !name.trim() ||
                                    name.trim() === action.file.name
                                }
                            >
                                {busy ? 'Saving…' : 'Save name'}
                            </button>
                        ) : (
                            !used.length && (
                                <button
                                    type="button"
                                    className="library-button library-button-danger"
                                    disabled={
                                        busy || loading || !details.length
                                    }
                                    onClick={() => void submit()}
                                >
                                    {busy ? 'Deleting…' : 'Delete permanently'}
                                </button>
                            )
                        )}
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
