import { attachmentMediaKind } from './attachment-media';

type AttachmentPlayerOptions = {
    url: string;
    name: string;
    mime: string;
    onResize?: () => void;
    isVisible?: () => boolean;
};

export function createAttachmentPlayer(options: AttachmentPlayerOptions) {
    const kind = attachmentMediaKind(options.mime);
    if (!kind) return null;
    let destroyed = false;
    const root = document.createElement('div');
    root.className = `attachment-player attachment-player-${kind}`;
    root.dataset.mediaKind = kind;
    const status = document.createElement('p');
    status.className = 'text-sm text-muted-foreground';
    status.setAttribute('role', 'status');
    status.hidden = true;
    let media: HTMLMediaElement | null = null;
    let pdf: HTMLIFrameElement | null = null;
    const pause = () => media?.pause();
    const showError = () => {
        if (destroyed) return;
        status.textContent =
            'Your browser could not preview this file. Use Download to open it in another app.';
        status.hidden = false;
        options.onResize?.();
    };
    if (kind === 'pdf') {
        const open = document.createElement('button');
        open.type = 'button';
        open.className = 'library-button';
        open.textContent = 'Open PDF';
        open.addEventListener('click', () => {
            if (pdf) return;
            pdf = document.createElement('iframe');
            pdf.title = `PDF: ${options.name}`;
            pdf.className = 'attachment-pdf-frame';
            pdf.allowFullscreen = true;
            pdf.addEventListener('error', showError);
            pdf.src = options.url;
            root.prepend(pdf);
            open.remove();
            options.onResize?.();
        });
        root.append(open);
    } else {
        media = document.createElement(kind);
        media.controls = true;
        media.preload = 'none';
        media.setAttribute('aria-label', options.name);
        if (media instanceof HTMLVideoElement) media.playsInline = true;
        media.src = options.url;
        media.addEventListener('error', showError);
        media.addEventListener('loadedmetadata', () => {
            if (!destroyed) options.onResize?.();
        });
        media.addEventListener('play', () => {
            if (document.hidden || options.isVisible?.() === false) pause();
        });
        root.append(media);
    }
    if (kind !== 'audio') {
        const fullscreen = document.createElement('button');
        fullscreen.type = 'button';
        fullscreen.className = 'library-button';
        fullscreen.textContent = 'Fullscreen';
        fullscreen.addEventListener('click', () => {
            if (!root.requestFullscreen) {
                status.textContent =
                    'Fullscreen is unavailable in this browser. Use the viewer controls or open the downloaded file.';
                status.hidden = false;
                return;
            }
            void root.requestFullscreen().catch(() => {
                status.textContent =
                    'Fullscreen could not open. Use the viewer controls.';
                status.hidden = false;
            });
        });
        root.append(fullscreen);
    }
    root.append(status);
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
        pause,
        destroy() {
            destroyed = true;
            document.removeEventListener('visibilitychange', visibilityChanged);
            observer.disconnect();
            pause();
            if (media) {
                media.removeAttribute('src');
                media.load();
            }
            pdf?.removeAttribute('src');
            root.remove();
        },
    };
}
