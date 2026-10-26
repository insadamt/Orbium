import { styleRichSourceControls } from './rich-block-heading';
import {
    claimTransferredMediaPlayer,
    registerTransferableMediaPlayer,
} from './transferred-media-players';
import type { AttachmentMetadata } from './rich-model';
import { EditorView } from '@codemirror/view';
import { attachmentMediaKind } from '@/components/media/attachment-media';
import { createAttachmentPlayer } from '@/components/media/attachment-player';
import {
    loadAttachmentMetadata,
    richAttachmentUrl,
    richMediaSourceUrl,
} from './attachment-metadata';
import { widgetIcon } from './widget-icons';
import { installMediaAvailability } from './media-availability';
import type { RichBlock, RichController, RichWidgetMount } from './rich-model';
import {
    applyRichSource,
    button,
    element,
    sourceControls,
} from './widget-controls';

export function mountFileMedia(mount: RichWidgetMount): RichController {
    let block = mount.block;
    let destroyed = false;
    let loadingId = '';
    let request: AbortController | undefined;
    let player: ReturnType<typeof createAttachmentPlayer> = null;
    let unregisterPlayer: (() => void) | undefined;
    let mediaKind: 'video' | 'audio' | 'pdf' | null = null;
    const controls = sourceControls(mount, 'File', false);
    const heading = styleRichSourceControls(mount, controls, {
        title: 'File',
        description: 'Attachment',
        icon: 'file',
    });
    const download = element(
        'a',
        'font-medium underline',
        block.label ?? 'Download file',
    );
    download.download = '';
    const details = element(
        'span',
        'ms-3 text-xs text-muted-foreground',
        'Loading attachment…',
    );
    controls.output.append(download, details);
    const availability = installMediaAvailability(mount, {
        imageMode: false,
        frame: controls.output,
        output: controls.output,
        image: element('img'),
        download,
        details,
        readBlock: () => block,
        onMissing: clearPlayer,
    });
    function clearPlayer() {
        unregisterPlayer?.();
        unregisterPlayer = undefined;
        player?.destroy();
        player = null;
        mediaKind = null;
        delete mount.root.dataset.mediaKind;
        controls.toolbar.hidden = false;
        updateActionAppearance(false);
        heading.actions.append(replace, remove);
        download.hidden = details.hidden = false;
    }
    function setMissing() {
        availability.setMissing(true);
    }
    const replace = button('Replace', () =>
        mount.context.onUpload({
            view: mount.view,
            from: block.from,
            to: block.to,
            kind: mediaKind ?? 'file',
            presentation: block.presentation,
            wrappers: block.wrappers,
        }),
    );
    const remove = button('Remove', () =>
        applyRichSource(mount.view, block, ''),
    );
    heading.actions.append(replace, remove);
    function updateActionAppearance(mediaPreview: boolean) {
        mount.root.classList.toggle('attachment-player', !mediaPreview);
        mount.root.classList.toggle('orbium-rich-card', !mediaPreview);
        controls.output.classList.toggle(
            'orbium-rich-card-content',
            !mediaPreview,
        );
        replace.className = remove.className = mediaPreview
            ? 'attachment-action attachment-edit-action'
            : 'attachment-action';
        replace.title = 'Replace file';
        replace.setAttribute('aria-label', 'Replace file');
        remove.title = 'Remove file';
        remove.setAttribute('aria-label', 'Remove file');
        replace.replaceChildren(widgetIcon('edit', 17));
        remove.replaceChildren(widgetIcon('trash', 17));
    }
    const pause = () => player?.pause();
    mount.view.dom.addEventListener('orbium:pause-media', pause);
    controls.toolbar.addEventListener('click', () => {
        if (controls.output.hidden) pause();
    });
    function update(next: RichBlock) {
        block = next;
        controls.update(next);
        replace.disabled = remove.disabled = !mount.view.state.facet(
            EditorView.editable,
        );
        if (next.missingReference) {
            request?.abort();
            loadingId = '';
            download.removeAttribute('href');
            setMissing();
            return true;
        }
        if (!next.attachmentId) return true;
        if (loadingId === next.attachmentId) {
            const metadata = mount.context.metadata.get(loadingId);
            if (metadata) {
                download.textContent = next.label || metadata.name;
                player?.setName(next.label || metadata.name);
            }
            return true;
        }
        clearPlayer();
        controls.toolbar.hidden = true;
        availability.setMissing(false);
        controls.error.hidden = true;
        loadingId = next.attachmentId;
        request?.abort();
        request = new AbortController();
        download.removeAttribute('href');
        const id = next.attachmentId;
        const installPlayer = (metadata: AttachmentMetadata) => {
            if (destroyed || loadingId !== id) return;
            const url = richAttachmentUrl(mount.context, id);
            download.href = `${url}?download=1`;
            download.download = metadata.name;
            download.textContent = block.label || metadata.name;
            details.textContent = `${metadata.mime_type} · ${Math.ceil(metadata.size_bytes / 1024)} KB`;
            mediaKind = attachmentMediaKind(metadata.mime_type);
            const label =
                mediaKind === 'pdf'
                    ? 'PDF'
                    : mediaKind
                      ? mediaKind[0].toUpperCase() + mediaKind.slice(1)
                      : 'File';
            heading.title.textContent = label;
            const playerOptions = {
                url: richMediaSourceUrl(mount.context, id),
                name: block.label || metadata.name,
                mime: metadata.mime_type,
                sizeBytes: metadata.size_bytes,
                onResize: () => mount.view.requestMeasure(),
                isVisible: mount.context.isVisible,
            };
            player =
                claimTransferredMediaPlayer(mount.context, id, mount.root) ??
                createAttachmentPlayer(playerOptions);
            if (!player) controls.toolbar.hidden = false;
            if (player) {
                controls.toolbar.hidden = true;
                updateActionAppearance(true);
                download.hidden = details.hidden = true;
                player.actions.prepend(replace, remove);
                controls.output.prepend(player.root);
                player.relocate(playerOptions);
                unregisterPlayer = registerTransferableMediaPlayer(
                    player.root,
                    {
                        attachmentId: id,
                        take: () => {
                            const retained = player;
                            retained?.prepareRelocation();
                            player = null;
                            replace.remove();
                            remove.remove();
                            unregisterPlayer?.();
                            unregisterPlayer = undefined;
                            return retained;
                        },
                    },
                );
                mount.root.dataset.mediaKind = mediaKind!;
                mount.root.setAttribute('aria-label', `${mediaKind} block`);
            }
            mount.view.requestMeasure();
        };
        const cachedMetadata = mount.context.metadata.get(id);
        if (cachedMetadata) installPlayer(cachedMetadata);
        else
            void loadAttachmentMetadata(mount.context, id, request.signal)
                .then(installPlayer)
                .catch((failure: unknown) => {
                    if (
                        destroyed ||
                        loadingId !== id ||
                        (failure instanceof DOMException &&
                            failure.name === 'AbortError')
                    )
                        return;
                    setMissing();
                    controls.error.textContent =
                        failure instanceof Error
                            ? failure.message
                            : 'Attachment unavailable.';
                    controls.error.hidden = false;
                });
        return true;
    }
    update(block);
    return {
        update,
        destroy() {
            destroyed = true;
            request?.abort();
            clearPlayer();
            controls.destroy();
            availability.destroy();
            mount.view.dom.removeEventListener('orbium:pause-media', pause);
        },
    };
}
