import { router } from '@inertiajs/react';
import { Database, Folder } from 'lucide-react';
import { useRef, useState } from 'react';
import { csrfToken } from '@/components/editor/editor-api';
import DocumentImageCropDialog from '@/pages/documents/document-image-crop-dialog';
import {
    documentImageTargets,
    getDocumentImageDimensions,
    supportedDocumentImageTypes,
    type DocumentImageKind,
} from '@/pages/documents/document-image-crop';
import DocumentMediaMenu from '@/pages/documents/document-media-menu';
import { nodeImageUrl, uploadNodeImage } from './node-media-api';

export type MediaContainer = {
    id: number;
    title: string;
    type: 'folder' | 'database';
    icon: string | null;
    cover_attachment_id: number | null;
    icon_attachment_id: number | null;
};

type HeaderChanges = Partial<
    Pick<
        MediaContainer,
        'title' | 'icon' | 'cover_attachment_id' | 'icon_attachment_id'
    >
>;

export function NodeMediaHeader({
    workspaceId,
    node,
    detail,
}: {
    workspaceId: number;
    node: MediaContainer;
    detail?: string;
}) {
    const [title, setTitle] = useState(node.title);
    const [legacyIcon, setLegacyIcon] = useState(node.icon);
    const [iconId, setIconId] = useState(node.icon_attachment_id);
    const [coverId, setCoverId] = useState(node.cover_attachment_id);
    const [error, setError] = useState('');
    const [iconUploading, setIconUploading] = useState(false);
    const [coverUploading, setCoverUploading] = useState(false);
    const [pendingCrop, setPendingCrop] = useState<{
        file: File;
        kind: DocumentImageKind;
    } | null>(null);
    const iconInput = useRef<HTMLInputElement>(null);
    const coverInput = useRef<HTMLInputElement>(null);
    const ContainerIcon = node.type === 'folder' ? Folder : Database;
    const label = node.type === 'folder' ? 'Folder' : 'Database';

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

    async function uploadImage(file: File, kind: DocumentImageKind) {
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
                await saveHeader({ cover_attachment_id: attachment.id })
            ) {
                setCoverId(attachment.id);
            }
        } catch {
            setError(`Could not upload the ${kind}.`);
        } finally {
            setUploading(false);
        }
    }

    async function prepareImage(file: File, kind: DocumentImageKind) {
        setError('');
        if (!supportedDocumentImageTypes.has(file.type)) {
            setError('Choose a PNG, JPEG, GIF, or WebP image.');
            return;
        }
        try {
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
        if (await saveHeader({ cover_attachment_id: null })) setCoverId(null);
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
        <div className="node-media-header">
            {coverId && (
                <img
                    className="node-media-cover"
                    src={nodeImageUrl(workspaceId, node.id, coverId)}
                    alt={`${label} cover`}
                />
            )}
            <div className="node-media-menu">
                <DocumentMediaMenu
                    entityLabel={label}
                    hasIcon={Boolean(iconId || legacyIcon)}
                    hasCover={Boolean(coverId)}
                    iconUploading={iconUploading}
                    coverUploading={coverUploading}
                    onChooseIcon={() => iconInput.current?.click()}
                    onRemoveIcon={() => void removeIcon()}
                    onChooseCover={() => coverInput.current?.click()}
                    onRemoveCover={() => void removeCover()}
                />
            </div>
            <div className="node-media-body">
                <div
                    className={`node-media-icon ${coverId ? 'node-media-icon-overlap' : ''}`}
                >
                    {iconId ? (
                        <img
                            src={nodeImageUrl(workspaceId, node.id, iconId)}
                            alt={`${label} icon`}
                        />
                    ) : legacyIcon ? (
                        <span aria-label={`${label} icon`}>{legacyIcon}</span>
                    ) : (
                        <ContainerIcon
                            size={29}
                            strokeWidth={1.4}
                            aria-hidden="true"
                        />
                    )}
                </div>
                <input
                    aria-label={`${label} title`}
                    value={title}
                    maxLength={255}
                    onChange={(event) => setTitle(event.target.value)}
                    onBlur={saveTitle}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') event.currentTarget.blur();
                    }}
                    placeholder={`Untitled ${node.type}`}
                />
                {detail && <p className="node-media-detail">{detail}</p>}
                {error && (
                    <p role="alert" className="node-media-error">
                        {error}
                    </p>
                )}
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
                    onConfirm={(file) => {
                        const kind = pendingCrop.kind;
                        setPendingCrop(null);
                        void uploadImage(file, kind);
                    }}
                />
            )}
        </div>
    );
}
