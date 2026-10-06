import { Head } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { useDocumentTab } from '@/components/navigation/document-tab-context';
import { useNavigation } from '@/components/navigation/navigation-store';
import { notifyPaneLocation } from '@/components/navigation/tab-navigation';
import type { EditorDocument } from '@/components/editor/editor-api';
import {
    attachmentUrl,
    csrfToken,
    documentUrl,
    uploadAttachment,
} from '@/components/editor/editor-api';
import DocumentImageCropDialog from '@/pages/documents/document-image-crop-dialog';
import {
    documentImageTargets,
    getDocumentImageDimensions,
    supportedDocumentImageTypes,
    type DocumentImageKind,
} from '@/pages/documents/document-image-crop';
import DocumentMediaMenu from '@/pages/documents/document-media-menu';
import {
    ratioNumber,
    type CoverRatio,
} from '@/components/hierarchy/cover-presentation';
import DatabasePropertyHeader from '@/pages/documents/database-property-header';
import DocumentOpeningPreview from '@/pages/documents/document-opening-preview';
import DocumentEditorLoader from '@/pages/documents/document-editor-loader';
import type {
    Candidate,
    FileReference,
    Property,
} from '@/pages/databases/types';

export type DocumentPageProps = {
    workspace: { id: number; name: string };
    node: {
        id: number;
        title: string;
        icon: string | null;
        parent_id: number | null;
    };
    document: {
        content: EditorDocument;
        revision: number;
        cover_attachment_id: number | null;
        cover_aspect_ratio: CoverRatio | null;
        icon_attachment_id: number | null;
    };
    databaseProperties: Property[];
    databaseValues: { property_id: number; value: unknown }[];
    mentionCandidates: Candidate[];
    databaseFiles: FileReference[];
};

type DocumentHeaderChanges = Partial<{
    title: string;
    icon: string | null;
    cover_attachment_id: number | null;
    cover_aspect_ratio: CoverRatio | null;
    icon_attachment_id: number | null;
}>;

export function DocumentPage({
    workspace,
    node,
    savedDocument,
    databaseProperties,
    databaseValues,
    mentionCandidates,
    databaseFiles,
    previewOnly = false,
}: {
    workspace: DocumentPageProps['workspace'];
    node: DocumentPageProps['node'];
    savedDocument: DocumentPageProps['document'];
    databaseProperties: DocumentPageProps['databaseProperties'];
    databaseValues: DocumentPageProps['databaseValues'];
    mentionCandidates: DocumentPageProps['mentionCandidates'];
    databaseFiles: DocumentPageProps['databaseFiles'];
    previewOnly?: boolean;
}) {
    const { active, tabId } = useDocumentTab();
    const [title, setTitle] = useState(node.title);
    const [legacyIcon, setLegacyIcon] = useState(node.icon);
    const [iconAttachmentId, setIconAttachmentId] = useState(
        savedDocument.icon_attachment_id,
    );
    const [coverId, setCoverId] = useState(savedDocument.cover_attachment_id);
    const [coverRatio, setCoverRatio] = useState(
        savedDocument.cover_aspect_ratio,
    );
    const [headerError, setHeaderError] = useState('');
    const [iconUploading, setIconUploading] = useState(false);
    const [coverUploading, setCoverUploading] = useState(false);
    const [pendingCrop, setPendingCrop] = useState<{
        file: File;
        kind: DocumentImageKind;
    } | null>(null);
    const iconInput = useRef<HTMLInputElement>(null);
    const coverInput = useRef<HTMLInputElement>(null);

    async function saveHeader(
        changes: DocumentHeaderChanges,
    ): Promise<boolean> {
        setHeaderError('');
        try {
            const response = await fetch(
                `${documentUrl(workspace.id, node.id)}/header`,
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
                if (
                    'title' in changes ||
                    'icon' in changes ||
                    'icon_attachment_id' in changes
                ) {
                    const iconChanged =
                        'icon' in changes || 'icon_attachment_id' in changes;
                    notifyPaneLocation({
                        title: changes.title ?? title,
                        kind: 'document',
                        ...(iconChanged
                            ? {
                                  icon: changes.icon ?? null,
                                  iconUrl: changes.icon_attachment_id
                                      ? attachmentUrl(
                                            workspace.id,
                                            node.id,
                                            changes.icon_attachment_id,
                                        )
                                      : null,
                              }
                            : {}),
                    });
                }
                if ('icon' in changes || 'icon_attachment_id' in changes) {
                    const attachmentId = changes.icon_attachment_id ?? null;
                    const navigation = useNavigation.getState();
                    const tab = navigation.tabs.find(
                        (item) => item.id === tabId,
                    );
                    const iconUrl = attachmentId
                        ? attachmentUrl(workspace.id, node.id, attachmentId)
                        : null;
                    if (tab)
                        navigation.recordPane(tabId, {
                            ...tab.entries[tab.index],
                            icon: changes.icon ?? null,
                            iconUrl,
                        });
                    else if (!tabId)
                        navigation.updateCurrentIcon(
                            changes.icon ?? null,
                            iconUrl,
                        );
                }
                return true;
            }
        } catch {}
        setHeaderError('Could not save the document header.');
        return false;
    }

    async function addCover(file: File, ratio: CoverRatio) {
        setHeaderError('');
        setCoverUploading(true);
        try {
            const attachment = await uploadAttachment(
                workspace.id,
                node.id,
                file,
            );
            if (!attachment.mime_type.startsWith('image/')) {
                setHeaderError(
                    'Choose a PNG, JPEG, GIF, or WebP image for the cover.',
                );
                return;
            }
            if (
                await saveHeader({
                    cover_attachment_id: attachment.id,
                    cover_aspect_ratio: ratio,
                })
            ) {
                setCoverId(attachment.id);
                setCoverRatio(ratio);
            }
        } catch (error) {
            setHeaderError(
                error instanceof Error
                    ? error.message
                    : 'Could not upload the cover.',
            );
        } finally {
            setCoverUploading(false);
        }
    }

    async function addIcon(file: File) {
        setHeaderError('');
        setIconUploading(true);
        try {
            const attachment = await uploadAttachment(
                workspace.id,
                node.id,
                file,
            );
            if (!attachment.mime_type.startsWith('image/')) {
                setHeaderError(
                    'Choose a PNG, JPEG, GIF, or WebP image for the icon.',
                );
                return;
            }
            if (
                await saveHeader({
                    icon: null,
                    icon_attachment_id: attachment.id,
                })
            ) {
                setIconAttachmentId(attachment.id);
                setLegacyIcon(null);
            }
        } catch (error) {
            setHeaderError(
                error instanceof Error
                    ? error.message
                    : 'Could not upload the icon.',
            );
        } finally {
            setIconUploading(false);
        }
    }

    async function prepareImage(file: File, kind: DocumentImageKind) {
        setHeaderError('');
        if (!supportedDocumentImageTypes.has(file.type)) {
            setHeaderError('Choose a PNG, JPEG, GIF, or WebP image.');
            return;
        }
        try {
            if (kind === 'cover') {
                setPendingCrop({ file, kind });
                return;
            }
            const dimensions = await getDocumentImageDimensions(file);
            const target = documentImageTargets[kind];
            if (
                dimensions.width === target.width &&
                dimensions.height === target.height &&
                file.size <= 10 * 1024 * 1024
            ) {
                if (kind === 'icon') void addIcon(file);
            } else {
                setPendingCrop({ file, kind });
            }
        } catch {
            setHeaderError(
                'Could not open this image. Please choose another image.',
            );
        }
    }

    function uploadCroppedImage(file: File, ratio: CoverRatio | null) {
        const kind = pendingCrop?.kind;
        setPendingCrop(null);
        if (kind === 'icon') void addIcon(file);
        if (kind === 'cover' && ratio) void addCover(file, ratio);
    }

    async function removeIcon() {
        if (await saveHeader({ icon: null, icon_attachment_id: null })) {
            setIconAttachmentId(null);
            setLegacyIcon(null);
        }
    }

    async function removeCover() {
        if (await saveHeader({ cover_attachment_id: null })) {
            setCoverId(null);
            setCoverRatio(null);
        }
    }

    return (
        <>
            {active && <Head title={title} />}
            <div className="floating-body-island floating-document-island mx-auto max-w-[1120px]">
                <div className="relative">
                    {coverId && (
                        <div
                            className={`flex justify-center ${coverRatio ? '' : 'aspect-[980/288]'}`}
                        >
                            <img
                                src={attachmentUrl(
                                    workspace.id,
                                    node.id,
                                    coverId,
                                )}
                                alt="Document cover"
                                className={
                                    coverRatio
                                        ? 'block h-auto max-h-[min(480px,55dvh)] max-w-full rounded-2xl object-contain'
                                        : 'h-full w-full rounded-2xl object-cover'
                                }
                                style={
                                    coverRatio
                                        ? {
                                              aspectRatio:
                                                  ratioNumber(coverRatio),
                                          }
                                        : undefined
                                }
                            />
                        </div>
                    )}
                    <div className="absolute top-3 right-3 z-20">
                        <DocumentMediaMenu
                            hasIcon={Boolean(iconAttachmentId || legacyIcon)}
                            hasCover={Boolean(coverId)}
                            iconUploading={iconUploading}
                            coverUploading={coverUploading}
                            onChooseIcon={() => iconInput.current?.click()}
                            onRemoveIcon={() => void removeIcon()}
                            onChooseCover={() => coverInput.current?.click()}
                            onRemoveCover={() => void removeCover()}
                        />
                    </div>
                    <div className="mx-auto flow-root max-w-[780px]">
                        {(iconAttachmentId || legacyIcon) && (
                            <div
                                className={`relative z-10 mb-5 ml-4 flex size-24 items-center justify-center overflow-hidden rounded-2xl border-4 border-background bg-muted shadow-md ${coverId && !coverRatio ? '-mt-12' : ''}`}
                            >
                                {iconAttachmentId ? (
                                    <img
                                        src={attachmentUrl(
                                            workspace.id,
                                            node.id,
                                            iconAttachmentId,
                                        )}
                                        alt="Document icon"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span
                                        className="text-5xl"
                                        aria-label="Document icon"
                                    >
                                        {legacyIcon}
                                    </span>
                                )}
                            </div>
                        )}
                        <input
                            aria-label="Document title"
                            value={title}
                            maxLength={255}
                            onChange={(event) => setTitle(event.target.value)}
                            onBlur={() => {
                                const clean = title.trim();
                                if (clean) {
                                    setTitle(clean);
                                    void saveHeader({ title: clean });
                                } else {
                                    setTitle(node.title);
                                }
                            }}
                            className={`mb-8 w-full border-0 bg-transparent text-4xl font-semibold tracking-tight shadow-none outline-none placeholder:text-muted-foreground focus-visible:outline-none md:text-5xl ${coverId && !iconAttachmentId && !legacyIcon ? 'mt-8' : ''}`}
                            placeholder="Untitled"
                        />
                        {headerError && (
                            <p
                                role="alert"
                                className="mb-5 text-sm text-destructive"
                            >
                                {headerError}
                            </p>
                        )}
                        {databaseProperties.length > 0 &&
                            node.parent_id !== null && (
                                <DatabasePropertyHeader
                                    workspaceId={workspace.id}
                                    databaseId={node.parent_id}
                                    documentId={node.id}
                                    properties={databaseProperties}
                                    values={databaseValues}
                                    candidates={mentionCandidates}
                                    files={databaseFiles}
                                />
                            )}
                        {previewOnly ? (
                            <DocumentOpeningPreview
                                content={savedDocument.content}
                            />
                        ) : (
                            <DocumentEditorLoader
                                workspaceId={workspace.id}
                                nodeId={node.id}
                                title={title}
                                content={savedDocument.content}
                                revision={savedDocument.revision}
                            />
                        )}
                    </div>
                </div>
                <input
                    ref={iconInput}
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/webp"
                    aria-label="Upload document icon"
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
                    aria-label="Upload cover"
                    className="hidden"
                    onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void prepareImage(file, 'cover');
                        event.target.value = '';
                    }}
                />
            </div>
            {active && pendingCrop && (
                <DocumentImageCropDialog
                    file={pendingCrop.file}
                    kind={pendingCrop.kind}
                    onCancel={() => setPendingCrop(null)}
                    onConfirm={uploadCroppedImage}
                />
            )}
        </>
    );
}
