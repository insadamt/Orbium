import { applyLibraryPageImage } from '@/components/library/library-page-media';
import type { LibraryFile } from '@/components/library/library-api';
import { router } from '@inertiajs/react';
import { Database, Folder, PanelsTopLeft } from 'lucide-react';
import { useRef, useState } from 'react';
import { csrfToken } from '@/components/editor/editor-api';
import DocumentImageCropDialog from '@/pages/documents/document-image-crop-dialog';
import {
    documentImageTargets,
    getDocumentImageDimensions,
    supportedDocumentImageTypes,
    type DocumentImageKind,
} from '@/pages/documents/document-image-crop';
import { PageMediaCover } from './page-media-cover';
import { PageTitleField } from './page-title-field';
import { PageMediaEditButton } from './page-media-edit-button';
import { nodeImageUrl, uploadNodeImage } from './node-media-api';
import { type CoverRatio } from './cover-presentation';
import { useCoverIconCutout } from './use-cover-icon-cutout';

export type MediaContainer = {
    id: number;
    title: string;
    type: 'folder' | 'database' | 'board';
    icon: string | null;
    cover_attachment_id: number | null;
    cover_aspect_ratio: CoverRatio | null;
    icon_attachment_id: number | null;
};

type HeaderChanges = Partial<
    Pick<
        MediaContainer,
        | 'title'
        | 'icon'
        | 'cover_attachment_id'
        | 'cover_aspect_ratio'
        | 'icon_attachment_id'
    >
>;

export function NodeMediaHeader({
    workspaceId,
    node,
    detail,
    layout = 'compact',
}: {
    workspaceId: number;
    node: MediaContainer;
    detail?: string;
    layout?: 'compact' | 'document';
}) {
    const [title, setTitle] = useState(node.title);
    const [legacyIcon, setLegacyIcon] = useState(node.icon);
    const [iconId, setIconId] = useState(node.icon_attachment_id);
    const [coverId, setCoverId] = useState(node.cover_attachment_id);
    const [coverRatio, setCoverRatio] = useState(node.cover_aspect_ratio);
    const { coverRef, iconRef } = useCoverIconCutout();
    const [error, setError] = useState('');
    const [iconUploading, setIconUploading] = useState(false);
    const [coverUploading, setCoverUploading] = useState(false);
    const [pendingCrop, setPendingCrop] = useState<{
        file: File;
        kind: DocumentImageKind;
    } | null>(null);
    const iconInput = useRef<HTMLInputElement>(null);
    const coverInput = useRef<HTMLInputElement>(null);
    const ContainerIcon =
        node.type === 'board'
            ? PanelsTopLeft
            : node.type === 'folder'
              ? Folder
              : Database;
    const label =
        node.type === 'board'
            ? 'Board'
            : node.type === 'folder'
              ? 'Folder'
              : 'Database';

    async function saveHeader(changes: HeaderChanges): Promise<boolean> {
        setError('');
        try {
            const response = await fetch(
                `/workspaces/${workspaceId}/nodes/${node.id}/header`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken(),
                        Accept: 'application/json',
                    },
                    body: JSON.stringify(changes),
                },
            );
            if (response.ok) {
                router.reload();
                return true;
            }
        } catch {}
        setError(`Could not save the ${node.type} header.`);
        return false;
    }

    async function uploadImage(
        file: File,
        kind: DocumentImageKind,
        ratio: CoverRatio | null = null,
    ) {
        const setUploading =
            kind === 'icon' ? setIconUploading : setCoverUploading;
        setUploading(true);
        setError('');
        try {
            const attachment = await uploadNodeImage(
                workspaceId,
                node.id,
                file,
            );
            if (kind === 'icon') {
                if (
                    await saveHeader({
                        icon: null,
                        icon_attachment_id: attachment.id,
                    })
                ) {
                    setIconId(attachment.id);
                    setLegacyIcon(null);
                }
            } else if (
                await saveHeader({
                    cover_attachment_id: attachment.id,
                    cover_aspect_ratio: ratio,
                })
            ) {
                setCoverId(attachment.id);
                setCoverRatio(ratio);
            }
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : `Could not upload the ${kind}.`,
            );
        } finally {
            setUploading(false);
        }
    }

    function reuseImage(file: LibraryFile, kind: DocumentImageKind) {
        return applyLibraryPageImage({
            file,
            kind,
            saveHeader,
            setSaving: kind === 'icon' ? setIconUploading : setCoverUploading,
            onApplied: () => {
                if (kind === 'icon') {
                    setIconId(file.id);
                    setLegacyIcon(null);
                } else {
                    setCoverId(file.id);
                    setCoverRatio('11:3');
                }
            },
        });
    }

    async function prepareImage(file: File, kind: DocumentImageKind) {
        setError('');
        if (!supportedDocumentImageTypes.has(file.type)) {
            setError('Choose a PNG, JPEG, GIF, or WebP image.');
            return;
        }
        try {
            if (kind === 'cover') {
                setPendingCrop({ file, kind });
                return;
            }
            const size = await getDocumentImageDimensions(file);
            const target = documentImageTargets[kind];
            if (
                size.width === target.width &&
                size.height === target.height &&
                file.size <= 10 * 1024 * 1024
            ) {
                void uploadImage(file, kind);
            } else {
                setPendingCrop({ file, kind });
            }
        } catch {
            setError('Could not open this image. Please choose another image.');
        }
    }

    async function removeIcon() {
        if (await saveHeader({ icon: null, icon_attachment_id: null })) {
            setLegacyIcon(null);
            setIconId(null);
        }
    }

    async function removeCover() {
        if (await saveHeader({ cover_attachment_id: null })) {
            setCoverId(null);
            setCoverRatio(null);
        }
    }

    function saveTitle() {
        const nextTitle = title.trim();
        if (!nextTitle) {
            setTitle(node.title);
        } else if (nextTitle !== node.title) {
            setTitle(nextTitle);
            void saveHeader({ title: nextTitle });
        }
    }

    return (
        <div
            className="node-media-header page-media-header"
            data-layout={layout}
        >
            <div className="node-media-layout">
                <PageMediaCover
                    workspaceId={workspaceId}
                    onChooseLibrary={(file) => void reuseImage(file, 'cover')}
                    imageUrl={
                        coverId
                            ? nodeImageUrl(workspaceId, node.id, coverId)
                            : null
                    }
                    aspectRatio={
                        coverId ? (coverRatio ?? undefined) : undefined
                    }
                    entityLabel={label}
                    coverRef={coverRef}
                    uploading={coverUploading}
                    onChooseImage={() => coverInput.current?.click()}
                    onResetImage={() => void removeCover()}
                />
                <div className="node-media-body">
                    <div
                        ref={iconRef}
                        className="node-media-icon node-media-icon-overlap page-media-editable"
                    >
                        {iconId ? (
                            <img
                                src={nodeImageUrl(workspaceId, node.id, iconId)}
                                alt={`${label} icon`}
                            />
                        ) : legacyIcon ? (
                            <span aria-label={`${label} icon`}>
                                {legacyIcon}
                            </span>
                        ) : (
                            <ContainerIcon
                                size={29}
                                strokeWidth={1.4}
                                aria-hidden="true"
                            />
                        )}
                        <div className="page-media-icon-edit">
                            <PageMediaEditButton
                                workspaceId={workspaceId}
                                onChooseLibrary={(file) =>
                                    void reuseImage(file, 'icon')
                                }
                                entityLabel={label}
                                kind="icon"
                                hasCustomImage={Boolean(iconId || legacyIcon)}
                                uploading={iconUploading}
                                onChooseImage={() => iconInput.current?.click()}
                                onResetImage={() => void removeIcon()}
                            />
                        </div>
                    </div>
                    <div className="node-media-title-row">
                        <PageTitleField
                            label={`${label} title`}
                            value={title}
                            onChange={setTitle}
                            onSave={saveTitle}
                            placeholder={`Untitled ${node.type}`}
                        />
                        {detail && (
                            <p className="node-media-detail">{detail}</p>
                        )}
                    </div>
                    {error && (
                        <p role="alert" className="node-media-error">
                            {error}
                        </p>
                    )}
                </div>
            </div>
            <input
                ref={iconInput}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                aria-label={`Upload ${node.type} icon`}
                className="hidden"
                onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void prepareImage(file, 'icon');
                    event.target.value = '';
                }}
            />
            <input
                ref={coverInput}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                aria-label={`Upload ${node.type} cover`}
                className="hidden"
                onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void prepareImage(file, 'cover');
                    event.target.value = '';
                }}
            />
            {pendingCrop && (
                <DocumentImageCropDialog
                    file={pendingCrop.file}
                    kind={pendingCrop.kind}
                    onCancel={() => setPendingCrop(null)}
                    onConfirm={(file, ratio) => {
                        const kind = pendingCrop.kind;
                        setPendingCrop(null);
                        void uploadImage(file, kind, ratio);
                    }}
                />
            )}
        </div>
    );
}
