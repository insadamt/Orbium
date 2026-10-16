import { EditorView } from '@codemirror/view';
import { attachmentMediaKind } from '@/components/media/attachment-media';
import { createAttachmentPlayer } from '@/components/media/attachment-player';
import {
    loadAttachmentMetadata,
    richAttachmentUrl,
} from './attachment-metadata';
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
    let mediaKind: 'video' | 'audio' | 'pdf' | null = null;
    const controls = sourceControls(mount, 'File', false);
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
        player?.destroy();
        player = null;
        mediaKind = null;
        delete mount.root.dataset.mediaKind;
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
    controls.toolbar.append(replace, remove);
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
            if (metadata) download.textContent = next.label || metadata.name;
            return true;
        }
        clearPlayer();
        availability.setMissing(false);
        controls.error.hidden = true;
        loadingId = next.attachmentId;
        request?.abort();
        request = new AbortController();
        download.removeAttribute('href');
        const id = next.attachmentId;
        void loadAttachmentMetadata(mount.context, id, request.signal)
            .then((metadata) => {
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
                if (controls.toolbar.firstElementChild)
                    controls.toolbar.firstElementChild.textContent = label;
                player = createAttachmentPlayer({
                    url,
                    name: metadata.name,
                    mime: metadata.mime_type,
                    onResize: () => mount.view.requestMeasure(),
                    isVisible: mount.context.isVisible,
                });
                if (player) {
                    controls.output.prepend(player.root);
                    mount.root.dataset.mediaKind = mediaKind!;
                    mount.root.setAttribute('aria-label', `${mediaKind} block`);
                }
                mount.view.requestMeasure();
            })
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
