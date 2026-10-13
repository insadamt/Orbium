import { useRef, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Check, ImagePlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { MasonryLayout } from '@/components/hierarchy/masonry-layout';
import { openLocation } from '@/components/navigation/tab-navigation';
import type { Auth } from '@/types';
import {
    libraryFilterParams,
    isLibraryImage,
    uploadLibraryFile,
    type LibraryFile,
} from './library-api';
import { libraryStateKey } from './library-browse-state';
import { LibraryCard } from './library-card';
import { LibraryToolbar } from './library-toolbar';
import {
    LibraryContextMenu,
    type LibraryMenuPosition,
} from './library-context-menu';
import {
    LibraryActionDialog,
    type LibraryAction,
    type LibraryActionResult,
} from './library-action-dialog';
import { useLibraryGallery } from './use-library-gallery';

export function LibraryBrowser({
    workspaceId,
    imagesOnly = false,
    filesOnly = false,
    onChoose,
}: {
    workspaceId: number;
    imagesOnly?: boolean;
    filesOnly?: boolean;
    onChoose?: (file: LibraryFile) => void;
}) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const picker = Boolean(onChoose);
    const gallery = useLibraryGallery({
        workspaceId,
        storageKey: libraryStateKey(workspaceId, auth.user.id),
        imagesOnly,
        picker,
        filesOnly,
    });
    const [contextMenu, setContextMenu] = useState<LibraryMenuPosition | null>(
        null,
    );
    const [selected, setSelected] = useState<LibraryFile[]>([]);
    const [action, setAction] = useState<LibraryAction | null>(null);
    const [upload, setUpload] = useState<{
        name: string;
        progress: number;
    } | null>(null);
    const [uploadError, setUploadError] = useState('');
    const input = useRef<HTMLInputElement>(null);
    const busy = Boolean(upload);
    function select(file: LibraryFile) {
        if (!picker) return;
        if (imagesOnly && !isLibraryImage(file)) return;
        if (filesOnly && isLibraryImage(file)) return;
        setSelected((previous) => (previous[0]?.id === file.id ? [] : [file]));
    }
    function openFile(file: LibraryFile) {
        gallery.rememberPosition();
        openLocation(
            `/workspaces/${workspaceId}/library/items/${file.id}?${libraryFilterParams(gallery.filters)}`,
        );
    }
    function finishAction(result: LibraryActionResult) {
        if (result.kind === 'rename') {
            const rename = (file: LibraryFile) =>
                file.id === result.id ? { ...file, name: result.name } : file;
            const matchesQuery = result.name
                .toLocaleLowerCase()
                .includes(gallery.filters.q.trim().toLocaleLowerCase());
            gallery.setFiles((files) => {
                const renamed = files
                    .map(rename)
                    .filter((file) => file.id !== result.id || matchesQuery);
                return gallery.filters.sort === 'name'
                    ? renamed.sort((a, b) =>
                          a.name
                              .toLocaleLowerCase()
                              .localeCompare(b.name.toLocaleLowerCase()),
                      )
                    : renamed;
            });
            if (!matchesQuery)
                gallery.setTotal((total) => Math.max(0, total - 1));
            setSelected((files) => files.map(rename));
            toast.success('Filename updated.');
        } else {
            gallery.setFiles((files) =>
                files.filter((file) => !result.ids.includes(file.id)),
            );
            gallery.setTotal((total) => Math.max(0, total - result.ids.length));
            setSelected((files) =>
                files.filter((file) => !result.ids.includes(file.id)),
            );
            gallery.refresh();
            toast.success(
                `${result.ids.length === 1 ? 'File' : `${result.ids.length} files`} deleted.`,
            );
        }
        setAction(null);
    }
    async function uploadFile(file: File) {
        setUploadError('');
        setUpload({ name: file.name, progress: 0 });
        try {
            await uploadLibraryFile(workspaceId, file, (progress) =>
                setUpload({ name: file.name, progress }),
            );
            toast.success(`${file.name} uploaded.`);
            gallery.refresh();
        } catch (failure) {
            setUploadError(
                failure instanceof Error
                    ? failure.message
                    : 'Could not upload this file.',
            );
        } finally {
            setUpload(null);
        }
    }
    const items = gallery.files.map((file) => ({
        ...file,
        estimatedHeight: (width: number) =>
            file.width && file.height
                ? (width * file.height) / file.width + 40
                : width * 0.8 + 40,
    }));
    return (
        <div className="library-browser" data-picker={picker}>
            <LibraryToolbar
                filters={gallery.filters}
                onChange={gallery.setFilters}
                onUpload={() => input.current?.click()}
                onRefresh={gallery.refresh}
                busy={busy || gallery.loading}
                imagesOnly={imagesOnly}
                filesOnly={filesOnly}
                picker={picker}
            />
            <div className="library-collection-status" role="status">
                {gallery.loading
                    ? 'Loading your Library…'
                    : `${gallery.total} ${gallery.total === 1 ? 'file' : 'files'}`}
            </div>
            {upload && (
                <div className="library-upload-status" role="status">
                    <span className="truncate">
                        {upload.progress === 100
                            ? 'Finishing upload'
                            : 'Uploading'}{' '}
                        · {upload.name}
                    </span>
                    <span>{upload.progress}%</span>
                    <progress
                        value={upload.progress}
                        max={100}
                        aria-label="Upload progress"
                    />
                </div>
            )}
            {(gallery.error || uploadError) && (
                <div role="alert" className="library-error">
                    <p>{gallery.error || uploadError}</p>
                    {gallery.error && (
                        <button
                            type="button"
                            className="library-button"
                            onClick={gallery.refresh}
                        >
                            Try again
                        </button>
                    )}
                </div>
            )}
            {gallery.loading && !gallery.files.length ? (
                <div className="library-skeletons" aria-hidden="true">
                    {Array.from({ length: 10 }, (_, index) => (
                        <div
                            key={index}
                            style={{ height: `${160 + (index % 3) * 70}px` }}
                        />
                    ))}
                </div>
            ) : !gallery.files.length ? (
                <div className="library-empty">
                    <ImagePlus size={42} strokeWidth={1.2} />
                    <h2>
                        {gallery.filters.q || gallery.filters.type !== 'all'
                            ? 'No matching files'
                            : 'A home for your uploads'}
                    </h2>
                    <p>
                        {gallery.filters.q || gallery.filters.type !== 'all'
                            ? 'Try another search or file type.'
                            : 'Upload once, then reuse files and images across your pages.'}
                    </p>
                    {!picker && (
                        <button
                            type="button"
                            className="library-button library-button-upload"
                            onClick={() => input.current?.click()}
                            disabled={busy}
                        >
                            Upload a file
                        </button>
                    )}
                </div>
            ) : (
                <MasonryLayout
                    items={items}
                    gap={18}
                    minimumWidth={picker ? 180 : 230}
                    compactMinimumWidth={145}
                    render={(file) => (
                        <LibraryCard
                            file={file}
                            selected={selected.some(
                                (item) => item.id === file.id,
                            )}
                            picker={picker}
                            disabled={busy || gallery.loading}
                            onOpen={() => openFile(file)}
                            onContextMenu={(event) => {
                                if (picker || busy || gallery.loading) return;
                                event.preventDefault();
                                event.stopPropagation();
                                const bounds =
                                    event.currentTarget.getBoundingClientRect();
                                setContextMenu({
                                    file,
                                    x:
                                        'clientX' in event
                                            ? event.clientX
                                            : bounds.left,
                                    y:
                                        'clientY' in event
                                            ? event.clientY
                                            : bounds.top,
                                    returnFocusTo:
                                        event.currentTarget.querySelector<HTMLButtonElement>(
                                            '.library-card-open',
                                        ),
                                });
                            }}
                            onSelect={() => select(file)}
                            onRename={(trigger) =>
                                setAction({
                                    kind: 'rename',
                                    file,
                                    returnFocusTo: trigger ?? undefined,
                                })
                            }
                            onDelete={(trigger) =>
                                setAction({
                                    kind: 'delete',
                                    files: [file],
                                    returnFocusTo: trigger ?? undefined,
                                })
                            }
                        />
                    )}
                />
            )}
            {!gallery.loading && gallery.hasMore && (
                <div className="library-load-more">
                    <button
                        type="button"
                        className="library-button"
                        disabled={gallery.loadingMore || busy}
                        onClick={() => void gallery.loadMore()}
                    >
                        {gallery.loadingMore && (
                            <Loader2
                                size={15}
                                className="motion-safe:animate-spin"
                            />
                        )}
                        {gallery.loadingMore ? 'Loading…' : 'Load more'}
                    </button>
                </div>
            )}
            {picker && selected.length > 0 && (
                <div
                    className="library-selection-bar"
                    role="region"
                    aria-label="Chosen file"
                >
                    <span className="truncate">{selected[0]?.name}</span>
                    <button
                        type="button"
                        className="library-button library-button-primary"
                        disabled={gallery.loading}
                        onClick={() => {
                            if (selected[0]) onChoose?.(selected[0]);
                        }}
                    >
                        <Check size={15} />
                        {imagesOnly ? 'Use image' : 'Use file'}
                    </button>
                </div>
            )}
            {contextMenu && (
                <LibraryContextMenu
                    position={contextMenu}
                    onClose={() => setContextMenu(null)}
                    onOpen={() => openFile(contextMenu.file)}
                    onRename={() =>
                        setAction({
                            kind: 'rename',
                            file: contextMenu.file,
                            returnFocusTo:
                                contextMenu.returnFocusTo ?? undefined,
                        })
                    }
                    onDelete={() =>
                        setAction({
                            kind: 'delete',
                            files: [contextMenu.file],
                            returnFocusTo:
                                contextMenu.returnFocusTo ?? undefined,
                        })
                    }
                />
            )}
            {action && (
                <LibraryActionDialog
                    workspaceId={workspaceId}
                    action={action}
                    onClose={() => setAction(null)}
                    onSuccess={finishAction}
                />
            )}
            <input
                type="file"
                ref={input}
                className="hidden"
                aria-label="Upload Library file"
                disabled={busy}
                onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = '';
                    if (file) void uploadFile(file);
                }}
            />
        </div>
    );
}
