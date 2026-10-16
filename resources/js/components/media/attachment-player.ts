import { widgetIcon } from '@/components/editor/markdown/rich/widget-icons';
import { attachmentMediaKind } from './attachment-media';
import { mediaIconButton, mountPlaybackControls } from './media-controls';
import { openMediaFullPreview } from './media-full-preview';
import { mountPdfReader } from './pdf-reader';

type AttachmentPlayerOptions = {
    url: string;
    name: string;
    mime: string;
    sizeBytes?: number;
    onResize?: () => void;
    isVisible?: () => boolean;
};

export function createAttachmentPlayer(options: AttachmentPlayerOptions) {
    const kind = attachmentMediaKind(options.mime);
    if (!kind) return null;
    let destroyed = false;
    let closePreview: (() => void) | undefined;
    let resumeAfterRelocate = false;
    const root = document.createElement('div');
    root.className = `attachment-player attachment-player-${kind}`;
    root.dataset.mediaKind = kind;
    const header = document.createElement('div');
    header.className = 'attachment-heading';
    const icon = document.createElement('span');
    icon.className = 'attachment-type-icon';
    icon.append(widgetIcon(kind === 'pdf' ? 'file' : kind, 20));
    const identity = document.createElement('div');
    identity.className = 'attachment-identity';
    const title = document.createElement('span');
    title.className = 'attachment-title';
    title.textContent = options.name;
    title.title = options.name;
    const description = document.createElement('span');
    description.className = 'attachment-description';
    const size =
        options.sizeBytes === undefined
            ? ''
            : options.sizeBytes < 1048576
              ? `${Math.ceil(options.sizeBytes / 1024)} KB`
              : `${(options.sizeBytes / 1048576).toFixed(1)} MB`;
    description.textContent = `${kind === 'pdf' ? 'PDF document' : kind === 'audio' ? 'Audio' : 'Video'}${size ? ` · ${size}` : ''}`;
    identity.append(title, description);
    const actions = document.createElement('div');
    actions.className = 'attachment-actions';
    const download = document.createElement('a');
    download.className = 'attachment-action';
    download.href = `${options.url}?download=1`;
    download.download = options.name;
    download.title = 'Download file';
    download.setAttribute('aria-label', 'Download file');
    download.append(widgetIcon('download', 17));
    const fullscreen = mediaIconButton(
        'Open fullscreen preview',
        'maximize',
        () => {
            if (closePreview || destroyed) return;
            closePreview = openMediaFullPreview({
                content: root,
                trigger: fullscreen,
                title: `${kind === 'pdf' ? 'PDF' : kind === 'audio' ? 'Audio' : 'Video'} preview`,
                onClose: () => {
                    closePreview = undefined;
                    options.onResize?.();
                },
                beforeRelocate: () => {
                    resumeAfterRelocate = Boolean(media && !media.paused);
                },
                afterRelocate: () => {
                    if (
                        resumeAfterRelocate &&
                        !destroyed &&
                        !document.hidden &&
                        options.isVisible?.() !== false
                    )
                        void media?.play().catch(() => showError());
                    reader?.refresh();
                },
            });
        },
    );
    fullscreen.setAttribute('aria-haspopup', 'dialog');
    actions.append(download, fullscreen);
    header.append(icon, identity, actions);
    const status = document.createElement('p');
    status.className = 'attachment-status';
    status.setAttribute('role', 'status');
    status.hidden = true;
    const showError = (
        message = 'This file could not be played. Download it to open it in another app.',
    ) => {
        if (destroyed) return;
        status.textContent = message;
        status.hidden = false;
        options.onResize?.();
    };
    root.append(header);
    let media: HTMLMediaElement | undefined;
    let controls: ReturnType<typeof mountPlaybackControls> | undefined;
    let reader: ReturnType<typeof mountPdfReader> | undefined;
    if (kind === 'pdf') {
        reader = mountPdfReader(
            options.url,
            options.name,
            showError,
            options.onResize,
        );
        root.append(reader.root);
    } else {
        media = document.createElement(kind);
        media.controls = false;
        media.preload = 'metadata';
        media.setAttribute('aria-label', options.name);
        media.src = options.url;
        controls = mountPlaybackControls(media, () => showError());
        if (media instanceof HTMLVideoElement) {
            media.playsInline = true;
            media.tabIndex = 0;
            const stage = document.createElement('div');
            stage.className = 'attachment-video-stage';
            const play = mediaIconButton(
                'Play video',
                'play',
                controls.togglePlayback,
            );
            play.classList.add('attachment-video-play');
            media.addEventListener('click', controls.togglePlayback);
            media.addEventListener('keydown', (event) => {
                if (event.ctrlKey || event.metaKey || event.altKey) return;
                if (event.key === ' ' || event.key === 'k')
                    controls?.togglePlayback();
                else if (
                    event.key === 'ArrowRight' &&
                    media &&
                    Number.isFinite(media.duration)
                )
                    media.currentTime = Math.min(
                        media.duration,
                        media.currentTime + 5,
                    );
                else if (event.key === 'ArrowLeft' && media)
                    media.currentTime = Math.max(0, media.currentTime - 5);
                else return;
                event.preventDefault();
                event.stopPropagation();
            });
            stage.append(media, play);
            root.append(stage);
        } else root.append(media);
        media.addEventListener('error', () => showError());
        for (const event of ['play', 'pause', 'ended'])
            media.addEventListener(event, () => {
                root.dataset.playing = String(
                    media && !media.paused && !media.ended,
                );
            });
        media.addEventListener('play', () => {
            status.hidden = true;
            if (document.hidden || options.isVisible?.() === false)
                media?.pause();
        });
        media.addEventListener('loadedmetadata', () => {
            if (!destroyed) options.onResize?.();
        });
        root.append(controls.root);
    }
    root.append(status);
    const pause = () => media?.pause();
    const visibilityChanged = () => {
        if (document.hidden) pause();
    };
    document.addEventListener('visibilitychange', visibilityChanged);
    const observer = new IntersectionObserver(() => {
        if (options.isVisible?.() === false) pause();
    });
    observer.observe(root);
    return {
        root,
        actions,
        pause,
        setName(name: string) {
            title.textContent = title.title = name;
        },
        destroy() {
            destroyed = true;
            closePreview?.();
            document.removeEventListener('visibilitychange', visibilityChanged);
            observer.disconnect();
            pause();
            controls?.destroy();
            reader?.destroy();
            if (media) {
                media.removeAttribute('src');
                media.load();
            }
            root.remove();
        },
    };
}
