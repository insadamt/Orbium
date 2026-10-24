import { useLayoutEffect, useRef, type RefObject } from 'react';
import type { UploadedAttachment } from '@/components/editor/editor-api';
import { acceptsUploadKind } from '@/components/media/attachment-media';
import { createAttachmentPlayer } from '@/components/media/attachment-player';
import type { BoardContentProps } from './board-text-block';
import type { BoardPdfSceneStore } from './instant-scene/board-pdf-scene-store';

export function useBoardMediaSurface(options: {
    host: RefObject<HTMLDivElement | null>;
    props: BoardContentProps;
    pendingImage: RefObject<number | null>;
    onImageLoaded: (image: HTMLImageElement) => void;
    onError: (message: string) => void;
    pdfScene?: BoardPdfSceneStore;
}) {
    const callbacks = useRef(options);
    callbacks.current = options;
    const { props, host, pdfScene } = options;
    const { object, workspaceId, boardId } = props;
    const attachmentId = object.data.attachment_id;
    const image = object.block_type === 'image';
    const uploadKind = image ? 'image' : (object.data.media_kind ?? 'file');
    const mediaLabel = uploadKind === 'pdf' ? 'PDF' : uploadKind;

    useLayoutEffect(() => {
        const output = host.current;
        if (!output) return;
        output.replaceChildren();
        output.className = '';
        if (!attachmentId) return;
        const abort = new AbortController();
        let player: ReturnType<typeof createAttachmentPlayer> = null;
        let mountedVersion = '';
        const discardUnavailable = () => {
            pdfScene?.invalidateAttachment(attachmentId);
            player?.destroy();
            player = null;
            output.replaceChildren();
        };
        const mountAttachment = (file: UploadedAttachment) => {
            if (file.id !== attachmentId) {
                discardUnavailable();
                throw new Error(
                    'File metadata does not match this attachment.',
                );
            }
            if (!acceptsUploadKind(uploadKind, file.mime_type)) {
                discardUnavailable();
                throw new Error(`Choose a supported ${mediaLabel} file.`);
            }
            const version = `${file.id}:${file.mime_type}:${file.size_bytes}`;
            const pdfSession = pdfScene?.createSession(object.id, file);
            if (player && mountedVersion === version) {
                player.setName(file.name);
                return;
            }
            player?.destroy();
            output.replaceChildren();
            mountedVersion = version;
            const url = `/workspaces/${workspaceId}/library/files/${attachmentId}`;
            if (image) {
                const element = document.createElement('img');
                element.onload = () => {
                    const current = callbacks.current;
                    if (
                        !abort.signal.aborted &&
                        current.pendingImage.current === attachmentId
                    ) {
                        current.pendingImage.current = null;
                        current.onImageLoaded(element);
                    }
                };
                const data = callbacks.current.props.object.data;
                element.style.objectFit = data.image_fit ?? 'cover';
                element.style.objectPosition = `${data.image_position?.x ?? 50}% ${data.image_position?.y ?? 50}%`;
                element.src = url;
                element.alt = data.caption || data.name || '';
                element.draggable = false;
                element.onerror = () => {
                    if (!abort.signal.aborted)
                        callbacks.current.onError(
                            'Image unavailable. Choose another Library image.',
                        );
                };
                output.append(element);
                return;
            }
            player = createAttachmentPlayer({
                url,
                name: file.name,
                mime: file.mime_type,
                sizeBytes: file.size_bytes,
                isVisible: () => true,
                pdfSession,
            });
            if (player) {
                //
                // Preserve Board dragging on page pixels while keeping native reader/playback controls in charge of their own gestures.
                //
                for (const controls of player.root.querySelectorAll<HTMLElement>(
                    '.attachment-pdf-controls, .attachment-playback-controls',
                ))
                    controls.dataset.boardInteractive = '';
                player.root.dataset.boardPlayer = '';
                output.append(player.root);
                if (pdfSession) player.refreshPdfLayout();
            } else {
                output.className =
                    'orbium-file rounded-xl border border-border p-4';
                const link = document.createElement('a');
                link.className = 'font-medium underline';
                link.href = `${url}?download=1`;
                link.textContent = file.name;
                link.dataset.boardInteractive = '';
                link.download = file.name;
                const details = document.createElement('span');
                details.className = 'ms-3 text-xs text-muted-foreground';
                details.textContent = `${Math.ceil(file.size_bytes / 1024)} KB`;
                output.append(link, details);
            }
        };
        callbacks.current.onError('');
        //
        // Attach known PDF pixels before paint; metadata revalidation must not blank an already prepared page or restart its reader.
        //
        const cached = pdfScene?.reuseMetadata(object.id, attachmentId);
        if (cached) mountAttachment(cached);
        const fetchMetadata = async () => {
            if (abort.signal.aborted) return;
            try {
                const response = await fetch(
                    `/workspaces/${workspaceId}/boards/${boardId}/attachments/${attachmentId}/metadata`,
                    {
                        headers: { Accept: 'application/json' },
                        signal: abort.signal,
                    },
                );
                if (!response.ok) {
                    if ([401, 403, 404, 410].includes(response.status))
                        discardUnavailable();
                    throw new Error(
                        'File unavailable. Choose another Library file.',
                    );
                }
                const file = (await response.json()) as UploadedAttachment;
                if (!abort.signal.aborted) mountAttachment(file);
            } catch (error) {
                if (!abort.signal.aborted)
                    callbacks.current.onError(
                        error instanceof Error
                            ? error.message
                            : 'File unavailable.',
                    );
            }
        };
        const cancelMetadata = pdfScene?.scheduleMetadataFetch(fetchMetadata);
        if (!pdfScene) void fetchMetadata();
        return () => {
            abort.abort();
            cancelMetadata?.();
            player?.destroy();
        };
    }, [
        attachmentId,
        workspaceId,
        boardId,
        image,
        uploadKind,
        mediaLabel,
        pdfScene,
        object.id,
        host,
    ]);
}
