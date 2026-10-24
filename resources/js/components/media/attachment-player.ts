import { widgetIcon } from '@/components/editor/markdown/rich/widget-icons';
import { attachmentMediaKind } from './attachment-media';
import { mediaIconButton, mountPlaybackControls } from './media-controls';
import { openMediaFullPreview } from './media-full-preview';
import { mountPdfReader } from './pdf-reader';
import { mountVideoFullscreen } from './video-fullscreen';
import type { PdfViewSession } from './pdf-view-session';

export type AttachmentPlayerOptions = {
    url: string;
    name: string;
    mime: string;
    sizeBytes?: number;
    onResize?: () => void;
    isVisible?: () => boolean;
    pdfSession?: PdfViewSession;
};

export function createAttachmentPlayer(options: AttachmentPlayerOptions) {
    const kind = attachmentMediaKind(options.mime);
    if (!kind) return null;
    let destroyed = false;
    let relocationPlayback:
        | { time: number; playing: boolean; volume: number; muted: boolean }
        | undefined;
    let closePreview: (() => void) | undefined;
    let videoFullscreen: ReturnType<typeof mountVideoFullscreen> | undefined;
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
            if (destroyed) return;
            if (kind === 'video') {
                void videoFullscreen?.open();
                return;
            }
            if (kind !== 'pdf' || closePreview) return;
            options.pdfSession?.activateReader();
            closePreview = openMediaFullPreview({
                content: root,
                trigger: fullscreen,
                title: 'PDF preview',
                onClose: () => {
                    closePreview = undefined;
                    options.onResize?.();
                },
                afterRelocate: () => reader?.refresh(),
            });
        },
    );
    if (kind === 'pdf') fullscreen.setAttribute('aria-haspopup', 'dialog');
    actions.append(download);
    if (kind !== 'audio') actions.append(fullscreen);
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
            options.pdfSession,
        );
        root.append(reader.root);
        const activateReader = () => options.pdfSession?.activateReader();
        root.addEventListener('pointerdown', activateReader);
        root.addEventListener('focusin', activateReader);
        root.addEventListener('wheel', activateReader, { passive: true });
    } else {
        media = document.createElement(kind);
        media.controls = false;
        media.preload = 'metadata';
        media.setAttribute('aria-label', options.name);
        media.src = options.url;
        controls = mountPlaybackControls(media, () => showError());
        if (media instanceof HTMLVideoElement) {
            videoFullscreen = mountVideoFullscreen(
                media,
                fullscreen,
                showError,
            );
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
            media.addEventListener('click', () => {
                if (!media?.controls) controls?.togglePlayback();
            });
            media.addEventListener('keydown', (event) => {
                if (
                    media?.controls ||
                    event.ctrlKey ||
                    event.metaKey ||
                    event.altKey
                )
                    return;
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
            if (root.ownerDocument.hidden || options.isVisible?.() === false)
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
        if (root.ownerDocument.hidden) pause();
    };
    let ownerDocument = root.ownerDocument;
    ownerDocument.addEventListener('visibilitychange', visibilityChanged);
    let observer = new IntersectionObserver(() => {
        if (options.isVisible?.() === false) pause();
    });
    observer.observe(root);
    return {
        root,
        actions,
        pause,
        refreshPdfLayout() {
            reader?.refresh();
        },
        prepareRelocation() {
            closePreview?.();
            if (media)
                relocationPlayback = {
                    time: media.currentTime,
                    playing: !media.paused && !media.ended,
                    volume: media.volume,
                    muted: media.muted,
                };
        },
        relocate(next: AttachmentPlayerOptions) {
            closePreview?.();
            options = next;
            ownerDocument.removeEventListener(
                'visibilitychange',
                visibilityChanged,
            );
            ownerDocument = root.ownerDocument;
            observer.disconnect();
            const OwnerIntersectionObserver =
                (ownerDocument.defaultView as typeof window | null)
                    ?.IntersectionObserver ?? IntersectionObserver;
            observer = new OwnerIntersectionObserver(() => {
                if (options.isVisible?.() === false) pause();
            });
            observer.observe(root);
            ownerDocument.addEventListener(
                'visibilitychange',
                visibilityChanged,
            );
            download.href = `${next.url}?download=1`;
            download.download = next.name;
            title.textContent = title.title = next.name;
            reader?.relocate(next.onResize);
            videoFullscreen?.relocate();
            if (media && relocationPlayback) {
                const playback = relocationPlayback;
                relocationPlayback = undefined;
                const restorePlayback = () => {
                    if (!media || destroyed) return;
                    media.volume = playback.volume;
                    media.muted = playback.muted;
                    if (
                        Number.isFinite(playback.time) &&
                        Math.abs(media.currentTime - playback.time) > 0.1
                    ) {
                        try {
                            media.currentTime = playback.time;
                        } catch {
                            /* A decoder can temporarily reject seeking during document adoption. */
                        }
                    }
                    if (playback.playing && options.isVisible?.() !== false)
                        void media.play().catch(() => {});
                };
                if (media.readyState >= 1) restorePlayback();
                else
                    media.addEventListener('loadedmetadata', restorePlayback, {
                        once: true,
                    });
            }
        },
        setName(name: string) {
            title.textContent = title.title = name;
        },
        destroy() {
            destroyed = true;
            closePreview?.();
            ownerDocument.removeEventListener(
                'visibilitychange',
                visibilityChanged,
            );
            observer.disconnect();
            pause();
            videoFullscreen?.destroy();
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
