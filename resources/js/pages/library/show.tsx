import { Head, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Download,
    ExternalLink,
    Pencil,
    Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { openLocation } from '@/components/navigation/tab-navigation';
import {
    LibraryActionDialog,
    type LibraryAction,
    type LibraryActionResult,
} from '@/components/library/library-action-dialog';
import { LibraryFilePreview } from '@/components/library/library-file-preview';
import {
    formatLibrarySize,
    libraryFileLabel,
    libraryFilterParams,
    type LibraryFileDetails,
    type LibraryFilters,
} from '@/components/library/library-api';

type Props = {
    workspace: { id: number; name: string };
    file: LibraryFileDetails;
    neighbors: { previous: number | null; next: number | null };
    filters: LibraryFilters;
};

export default function LibraryFilePage() {
    const props = usePage<Props>().props;
    const [draftFile, setFile] = useState(props.file);
    const file = draftFile.id === props.file.id ? draftFile : props.file;
    const [action, setAction] = useState<LibraryAction | null>(null);
    useEffect(() => {
        setFile(props.file);
        setAction(null);
    }, [props.file]);
    const base = `/workspaces/${props.workspace.id}/library`;
    const params = libraryFilterParams(props.filters).toString();
    const galleryUrl = `${base}?${params}`;
    function navigateFile(id: number | null) {
        if (id !== null) openLocation(`${base}/items/${id}?${params}`);
    }
    function finishAction(result: LibraryActionResult) {
        setAction(null);
        if (result.kind === 'rename') {
            setFile((current) => ({ ...current, name: result.name }));
            toast.success('Filename updated.');
            router.reload({ only: ['file', 'neighbors', 'breadcrumbs'] });
        } else {
            toast.success('File deleted.');
            openLocation(galleryUrl);
        }
    }
    return (
        <main className="library-page library-detail-page">
            <Head title={file.name} />
            <div className="library-detail-navigation">
                <button
                    type="button"
                    className="library-button"
                    onClick={() => openLocation(galleryUrl)}
                >
                    <ArrowLeft size={16} />
                    Back to Library
                </button>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className="library-icon-button"
                        aria-label="Previous file"
                        disabled={props.neighbors.previous === null}
                        onClick={() => navigateFile(props.neighbors.previous)}
                    >
                        <ArrowLeft size={17} />
                    </button>
                    <button
                        type="button"
                        className="library-icon-button"
                        aria-label="Next file"
                        disabled={props.neighbors.next === null}
                        onClick={() => navigateFile(props.neighbors.next)}
                    >
                        <ArrowRight size={17} />
                    </button>
                </div>
            </div>
            <div className="library-detail-layout">
                <LibraryFilePreview key={file.id} file={file} />
                <aside className="library-detail-panel">
                    <p className="library-eyebrow">
                        {libraryFileLabel(file)} · {props.workspace.name}
                    </p>
                    <h1>{file.name}</h1>
                    <div className="library-detail-actions">
                        <a
                            href={`${file.url}?download=1`}
                            className="library-button library-button-primary"
                            aria-disabled={!file.available}
                            onClick={(event) => {
                                if (!file.available) event.preventDefault();
                            }}
                        >
                            <Download size={16} />
                            Download
                        </a>
                        <button
                            type="button"
                            className="library-icon-button"
                            aria-label="Rename file"
                            onClick={(event) =>
                                setAction({
                                    kind: 'rename',
                                    file,
                                    returnFocusTo: event.currentTarget,
                                })
                            }
                        >
                            <Pencil size={16} />
                        </button>
                    </div>
                    <dl className="library-metadata">
                        <div>
                            <dt>File type</dt>
                            <dd>{file.mime_type}</dd>
                        </div>
                        <div>
                            <dt>Size</dt>
                            <dd>{formatLibrarySize(file.size_bytes)}</dd>
                        </div>
                        {file.width && file.height && (
                            <div>
                                <dt>Dimensions</dt>
                                <dd>
                                    {file.width.toLocaleString()} ×{' '}
                                    {file.height.toLocaleString()} px
                                </dd>
                            </div>
                        )}
                        <div>
                            <dt>Uploaded</dt>
                            <dd>
                                {new Date(file.created_at).toLocaleString()}
                            </dd>
                        </div>
                        <div>
                            <dt>Storage</dt>
                            <dd>
                                {file.available ? 'Available' : 'File missing'}
                            </dd>
                        </div>
                    </dl>
                    <section className="library-usage">
                        <h2>
                            Used in <span>{file.usage.length}</span>
                        </h2>
                        {file.usage.length ? (
                            <div className="space-y-2">
                                {file.usage.map((usage) => (
                                    <button
                                        type="button"
                                        key={usage.id}
                                        onClick={() => openLocation(usage.url)}
                                        className="library-usage-link"
                                    >
                                        <span className="min-w-0">
                                            <span className="block truncate">
                                                {usage.title}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {usage.trashed
                                                    ? 'In Trash'
                                                    : 'Open page'}
                                            </span>
                                        </span>
                                        <ExternalLink size={14} />
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                This file is not used in saved content. It is
                                ready to reuse.
                            </p>
                        )}
                    </section>
                    <div className="library-detail-delete">
                        <button
                            type="button"
                            className="library-button library-button-danger"
                            disabled={file.usage.length > 0}
                            onClick={(event) =>
                                setAction({
                                    kind: 'delete',
                                    files: [file],
                                    returnFocusTo: event.currentTarget,
                                })
                            }
                        >
                            <Trash2 size={15} />
                            Delete file
                        </button>
                        <p>
                            {file.usage.length
                                ? 'Remove every saved reference, including those in Trash, before deleting.'
                                : 'Permanent deletion cannot be undone.'}
                        </p>
                    </div>
                </aside>
            </div>
            {action && (
                <LibraryActionDialog
                    workspaceId={props.workspace.id}
                    action={action}
                    onClose={() => setAction(null)}
                    onSuccess={finishAction}
                />
            )}
        </main>
    );
}
