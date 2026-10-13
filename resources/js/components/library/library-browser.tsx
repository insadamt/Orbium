import { useEffect, useRef, useState } from 'react';
import { File, Upload, Trash2 } from 'lucide-react';
import { openLocation } from '@/components/navigation/tab-navigation';
import {
    formatLibrarySize,
    isLibraryImage,
    libraryRequest,
    type LibraryFile,
} from './library-api';

export function LibraryBrowser({
    workspaceId,
    imagesOnly = false,
    onChoose,
}: {
    workspaceId: number;
    imagesOnly?: boolean;
    onChoose?: (file: LibraryFile) => void;
}) {
    const [files, setFiles] = useState<LibraryFile[]>([]);
    const [query, setQuery] = useState('');
    const [type, setType] = useState(imagesOnly ? 'images' : 'all');
    const [sort, setSort] = useState('newest');
    const [selected, setSelected] = useState<number[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [revision, setRevision] = useState(0);
    const [renameFile, setRenameFile] = useState<LibraryFile | null>(null);
    const [name, setName] = useState('');
    const [deleteIds, setDeleteIds] = useState<number[] | null>(null);
    const input = useRef<HTMLInputElement>(null);
    const base = `/workspaces/${workspaceId}/library`;
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError('');
        libraryRequest<{ files: LibraryFile[] }>(`${base}/files`)
            .then((result) => {
                if (!cancelled) {
                    setFiles(result.files);
                    setSelected([]);
                }
            })
            .catch((failure: Error) => {
                if (!cancelled) setError(failure.message);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [base, revision]);
    const visible = files
        .filter(
            (file) =>
                file.name
                    .toLocaleLowerCase()
                    .includes(query.toLocaleLowerCase()) &&
                (type === 'all' ||
                    (type === 'images'
                        ? isLibraryImage(file)
                        : !isLibraryImage(file))),
        )
        .sort((a, b) =>
            sort === 'name'
                ? a.name.localeCompare(b.name)
                : sort === 'size'
                  ? b.size_bytes - a.size_bytes
                  : b.created_at.localeCompare(a.created_at),
        );
    const selectedUsed = files.some(
        (file) => selected.includes(file.id) && file.usage.length > 0,
    );
    async function mutate(action: () => Promise<unknown>) {
        setBusy(true);
        setError('');
        try {
            await action();
            setRenameFile(null);
            setDeleteIds(null);
            setRevision((value) => value + 1);
        } catch (failure) {
            setError(
                failure instanceof Error
                    ? failure.message
                    : 'Could not update the Library.',
            );
        } finally {
            setBusy(false);
        }
    }
    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
                <input
                    type="search"
                    aria-label="Search Library"
                    placeholder="Search files…"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="min-w-40 flex-1 rounded-lg border bg-background px-3 py-2"
                />
                {!imagesOnly && (
                    <select
                        aria-label="File type"
                        value={type}
                        onChange={(event) => setType(event.target.value)}
                        className="rounded-lg border bg-background p-2"
                    >
                        <option value="all">All files</option>
                        <option value="images">Images</option>
                        <option value="files">Files</option>
                    </select>
                )}
                <select
                    aria-label="Sort files"
                    value={sort}
                    onChange={(event) => setSort(event.target.value)}
                    className="rounded-lg border bg-background p-2"
                >
                    <option value="newest">Newest first</option>
                    <option value="name">Name</option>
                    <option value="size">Largest first</option>
                </select>
                {!onChoose && (
                    <button
                        disabled={busy || loading}
                        onClick={() => input.current?.click()}
                        className="flex items-center gap-2 rounded-lg border px-3 py-2"
                    >
                        <Upload size={16} /> Upload
                    </button>
                )}
                <button
                    disabled={busy}
                    onClick={() => setRevision((value) => value + 1)}
                    className="rounded-lg border px-3 py-2"
                >
                    Refresh
                </button>
            </div>
            {!onChoose && (
                <div className="flex flex-wrap items-center gap-3 text-sm">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            disabled={busy || loading || !visible.length}
                            checked={
                                visible.length > 0 &&
                                visible.every((file) =>
                                    selected.includes(file.id),
                                )
                            }
                            onChange={(event) =>
                                setSelected(
                                    event.target.checked
                                        ? visible
                                              .map((file) => file.id)
                                              .slice(0, 100)
                                        : [],
                                )
                            }
                        />{' '}
                        Select visible (up to 100)
                    </label>
                    <span>{selected.length} selected</span>
                    <button
                        className="flex items-center gap-2 rounded-lg border px-3 py-2 disabled:opacity-40"
                        disabled={busy || !selected.length || selectedUsed}
                        onClick={() => setDeleteIds(selected)}
                    >
                        <Trash2 size={15} /> Delete selected
                    </button>
                    {selectedUsed && (
                        <span className="text-muted-foreground">
                            Selection includes files that are still used.
                        </span>
                    )}
                </div>
            )}
            {error && (
                <p role="alert" className="text-sm text-destructive">
                    {error}
                </p>
            )}
            {renameFile && (
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        void mutate(() =>
                            libraryRequest(`${base}/files/${renameFile.id}`, {
                                method: 'PATCH',
                                body: JSON.stringify({ name }),
                            }),
                        );
                    }}
                    className="flex flex-wrap items-center gap-2 rounded-xl border p-4"
                >
                    <label>
                        Filename{' '}
                        <input
                            autoFocus
                            maxLength={255}
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            className="rounded border bg-background p-2"
                        />
                    </label>
                    <button
                        disabled={busy || !name.trim()}
                        className="rounded border px-3 py-2"
                    >
                        Save
                    </button>
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() => setRenameFile(null)}
                    >
                        Cancel
                    </button>
                </form>
            )}
            {deleteIds && (
                <div role="alert" className="space-y-3 rounded-xl border p-4">
                    <p>
                        Permanently delete {deleteIds.length} file(s)? This
                        cannot be undone.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {files
                            .filter((file) => deleteIds.includes(file.id))
                            .map((file) => file.name)
                            .join(', ')}
                    </p>
                    <div className="flex gap-4">
                        <button
                            disabled={busy}
                            className="rounded-lg bg-destructive px-3 py-2 text-white"
                            onClick={() =>
                                void mutate(() =>
                                    libraryRequest(`${base}/delete`, {
                                        method: 'POST',
                                        body: JSON.stringify({
                                            ids: deleteIds,
                                            confirmed: true,
                                        }),
                                    }),
                                )
                            }
                        >
                            {busy ? 'Deleting…' : 'Delete permanently'}
                        </button>
                        <button
                            disabled={busy}
                            onClick={() => setDeleteIds(null)}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
            {loading ? (
                <p role="status">Loading Library…</p>
            ) : visible.length === 0 ? (
                <p className="py-12 text-center text-muted-foreground">
                    {files.length
                        ? 'No matching files.'
                        : 'Your Library is empty. Upload a file or add one to a page.'}
                </p>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {visible.map((file) => (
                        <article
                            key={file.id}
                            className="min-w-0 space-y-3 rounded-xl border bg-card/60 p-4"
                        >
                            <div className="flex h-32 items-center justify-center overflow-hidden rounded-lg bg-muted/40">
                                {isLibraryImage(file) && file.available ? (
                                    <img
                                        src={file.url}
                                        alt={file.name}
                                        loading="lazy"
                                        className="h-full w-full object-contain"
                                    />
                                ) : (
                                    <File
                                        size={32}
                                        className="text-muted-foreground"
                                    />
                                )}
                            </div>
                            <div>
                                <p
                                    className="truncate font-medium"
                                    title={file.name}
                                >
                                    {file.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {formatLibrarySize(file.size_bytes)} ·{' '}
                                    {new Date(
                                        file.created_at,
                                    ).toLocaleDateString()}{' '}
                                    · {file.mime_type}
                                </p>
                            </div>
                            {!file.available && (
                                <p className="text-sm text-destructive">
                                    File is missing from storage.
                                </p>
                            )}
                            {onChoose ? (
                                <button
                                    disabled={busy || !file.available}
                                    className="w-full rounded-lg border py-2"
                                    onClick={() => onChoose(file)}
                                >
                                    Use{' '}
                                    {isLibraryImage(file) ? 'image' : 'file'}
                                </button>
                            ) : (
                                <>
                                    <div className="flex flex-wrap items-center gap-3 text-sm">
                                        <label className="flex items-center gap-1">
                                            <input
                                                type="checkbox"
                                                aria-label={`Select ${file.name}`}
                                                disabled={
                                                    busy ||
                                                    (!selected.includes(
                                                        file.id,
                                                    ) &&
                                                        selected.length >= 100)
                                                }
                                                checked={selected.includes(
                                                    file.id,
                                                )}
                                                onChange={(event) =>
                                                    setSelected((previous) =>
                                                        event.target.checked
                                                            ? [
                                                                  ...previous,
                                                                  file.id,
                                                              ]
                                                            : previous.filter(
                                                                  (id) =>
                                                                      id !==
                                                                      file.id,
                                                              ),
                                                    )
                                                }
                                            />{' '}
                                            Select
                                        </label>
                                        <a
                                            href={file.url}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            {isLibraryImage(file)
                                                ? 'Preview'
                                                : 'Download'}
                                        </a>
                                        <a href={`${file.url}?download=1`}>
                                            Download
                                        </a>
                                        <button
                                            disabled={busy}
                                            onClick={() => {
                                                setRenameFile(file);
                                                setName(file.name);
                                            }}
                                        >
                                            Rename
                                        </button>
                                        <button
                                            disabled={
                                                busy || file.usage.length > 0
                                            }
                                            onClick={() =>
                                                setDeleteIds([file.id])
                                            }
                                            className="text-destructive disabled:opacity-40"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        <p>
                                            {file.usage.length
                                                ? `Used in ${file.usage.length} page(s)`
                                                : 'Not used in saved content'}
                                        </p>
                                        {file.usage.map((usage) => (
                                            <button
                                                key={usage.id}
                                                onClick={() =>
                                                    openLocation(usage.url)
                                                }
                                                className="mr-2 max-w-full truncate underline"
                                            >
                                                {usage.title}
                                                {usage.trashed
                                                    ? ' (Trash)'
                                                    : ''}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </article>
                    ))}
                </div>
            )}
            <input
                ref={input}
                type="file"
                className="hidden"
                aria-label="Upload Library file"
                disabled={busy}
                onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = '';
                    if (file)
                        void mutate(() => {
                            const body = new FormData();
                            body.append('file', file);
                            return libraryRequest(`${base}/files`, {
                                method: 'POST',
                                body,
                            });
                        });
                }}
            />
        </div>
    );
}
