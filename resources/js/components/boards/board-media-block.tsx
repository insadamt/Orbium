import { AudioLines, FileText, Image, Paperclip, Video } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { BoardMediaSettings } from './board-media-settings';
import { clamp } from './board-geometry';
import { boardLimits } from './board-types';
import { LibraryPicker } from '@/components/library/library-picker';
import {
    uploadAttachment,
    type UploadedAttachment,
} from '@/components/editor/editor-api';
import {
    acceptsUploadKind,
    uploadAccept,
} from '@/components/media/attachment-media';
import { useBoardMediaSurface } from './use-board-media-surface';
import type { BoardPdfSceneStore } from './instant-scene/board-pdf-scene-store';
import type { BoardContentProps } from './board-text-block';

export function BoardMediaBlock(
    props: BoardContentProps & { pdfScene?: BoardPdfSceneStore },
) {
    const { object, editing, readOnly } = props;
    const { data } = object;
    const [libraryOpen, setLibraryOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const uploadingNow = useRef(false);
    const [error, setError] = useState('');
    const host = useRef<HTMLDivElement>(null);
    const input = useRef<HTMLInputElement>(null);
    const callbacks = useRef(props);
    callbacks.current = props;
    const pendingImage = useRef<number | null>(null);
    const image = object.block_type === 'image';
    const uploadKind = image ? 'image' : (data.media_kind ?? 'file');
    const mediaLabel = data.media_kind === 'pdf' ? 'PDF' : uploadKind;
    const EmptyIcon = {
        image: Image,
        file: Paperclip,
        pdf: FileText,
        video: Video,
        audio: AudioLines,
    }[uploadKind];
    const emptyHeading = {
        image: 'Add an image',
        file: 'Keep a file here',
        pdf: 'Add a PDF',
        video: 'Add a video',
        audio: 'Add audio',
    }[uploadKind];
    useBoardMediaSurface({
        host,
        props,
        pendingImage,
        onImageLoaded: (element) => resetImageProportions(element),
        onError: setError,
        pdfScene: props.pdfScene,
    });
    useEffect(() => {
        const element = host.current?.querySelector('img');
        if (!element) return;
        element.style.objectFit = data.image_fit ?? 'cover';
        element.style.objectPosition = `${data.image_position?.x ?? 50}% ${data.image_position?.y ?? 50}%`;
    }, [data.image_fit, data.image_position]);
    function resetImageProportions(
        element = host.current?.querySelector('img'),
    ) {
        const current = callbacks.current;
        if (
            !element?.naturalWidth ||
            !element.naturalHeight ||
            current.readOnly
        )
            return;
        const ratio = element.naturalWidth / element.naturalHeight;
        const captionHeight =
            host.current?.parentElement?.querySelector<HTMLElement>(
                '.board-media-caption',
            )?.offsetHeight ?? 0;
        const captionSpace = captionHeight
            ? (captionHeight + 8) * (current.object.data.text_scale ?? 1)
            : 0;
        const minimumWidth = Math.max(
            boardLimits.minWidth,
            (boardLimits.minHeight - captionSpace) * ratio,
        );
        const maximumWidth = Math.min(
            boardLimits.maxSize,
            (boardLimits.maxSize - captionSpace) * ratio,
        );
        const width = clamp(
            current.object.width,
            Math.min(minimumWidth, maximumWidth),
            maximumWidth,
        );
        current.onObjectChange({
            ...current.object,
            width: clamp(width, boardLimits.minWidth, boardLimits.maxSize),
            height: clamp(
                width / ratio + captionSpace,
                boardLimits.minHeight,
                boardLimits.maxSize,
            ),
            data: {
                ...current.object.data,
                image_fit: 'contain',
                image_position: { x: 50, y: 50 },
            },
        });
    }
    function choose(file: UploadedAttachment) {
        if (readOnly || uploadingNow.current) return;
        if (!acceptsUploadKind(uploadKind, file.mime_type)) {
            setError(`Choose a supported ${mediaLabel} file.`);
            return;
        }
        setError('');
        setLibraryOpen(false);
        if (image) pendingImage.current = file.id;
        props.onChange({ ...data, attachment_id: file.id, name: file.name });
    }
    async function upload(file: File) {
        if (uploadingNow.current || readOnly) return;
        uploadingNow.current = true;
        setUploading(true);
        props.onUploading(true);
        setError('');
        try {
            const uploaded = await uploadAttachment(
                props.workspaceId,
                props.boardId,
                file,
                'board',
            );
            //
            // Validate the server-detected type because file extensions and browser MIME values can be wrong.
            //
            if (!acceptsUploadKind(uploadKind, uploaded.mime_type))
                throw new Error(
                    `Choose a supported ${mediaLabel} file. The upload remains in Library.`,
                );
            if (image) pendingImage.current = uploaded.id;
            callbacks.current.onChange({
                ...callbacks.current.object.data,
                attachment_id: uploaded.id,
                name: uploaded.name,
            });
        } catch (failure) {
            setError(
                failure instanceof Error ? failure.message : 'Upload failed.',
            );
        } finally {
            uploadingNow.current = false;
            setUploading(false);
            callbacks.current.onUploading(false);
        }
    }
    return (
        <div
            className={`board-media-block ${image ? 'board-media-image' : ''}`}
            data-has-attachment={Boolean(data.attachment_id)}
        >
            <div ref={host} hidden={!data.attachment_id} />
            {!data.attachment_id && (
                <div
                    className="board-media-empty"
                    data-board-editor={editing || undefined}
                    onDragOver={(event) => {
                        if (editing && !readOnly) {
                            event.preventDefault();
                            event.stopPropagation();
                        }
                    }}
                    onDrop={(event) => {
                        if (!editing || readOnly) return;
                        event.preventDefault();
                        event.stopPropagation();
                        const file = event.dataTransfer.files[0];
                        if (file) void upload(file);
                    }}
                >
                    <EmptyIcon size={28} strokeWidth={1.3} />
                    <strong>{emptyHeading}</strong>
                    <span>
                        {editing
                            ? 'Drop a file, upload, or choose from your Library.'
                            : 'Double-click to add your file.'}
                    </span>
                </div>
            )}
            {data.caption && (
                <p className="board-media-caption">{data.caption}</p>
            )}
            <BoardMediaSettings
                props={props}
                onUpload={() => input.current?.click()}
                onChooseLibrary={() => setLibraryOpen(true)}
                uploading={uploading}
                onResetProportions={() => resetImageProportions()}
            />
            {uploading && <p role="status">Uploading…</p>}
            {error && (
                <p role="alert" className="text-sm text-destructive">
                    {error}
                </p>
            )}
            <input
                ref={input}
                type="file"
                hidden
                accept={uploadAccept(uploadKind) || undefined}
                onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void upload(file);
                    event.target.value = '';
                }}
            />
            {libraryOpen && (
                <LibraryPicker
                    workspaceId={props.workspaceId}
                    imagesOnly={image}
                    filesOnly={!image}
                    mediaKind={data.media_kind}
                    onChoose={choose}
                    onClose={() => setLibraryOpen(false)}
                    onUpload={() => {
                        setLibraryOpen(false);
                        input.current?.click();
                    }}
                />
            )}
        </div>
    );
}
