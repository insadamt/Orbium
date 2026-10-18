type NativeFullscreenVideo = HTMLVideoElement & {
    webkitEnterFullscreen?: () => void;
};

export function mountVideoFullscreen(
    video: NativeFullscreenVideo,
    trigger: HTMLButtonElement,
    reportError: (message: string) => void,
) {
    let fullscreen = false;
    let ownerDocument = video.ownerDocument;
    function updateFullscreen(active: boolean) {
        const wasFullscreen = fullscreen;
        fullscreen = active;
        video.controls = active;
        if (wasFullscreen && !active && trigger.isConnected)
            trigger.focus({ preventScroll: true });
    }
    const fullscreenChanged = () =>
        updateFullscreen(ownerDocument.fullscreenElement === video);
    const nativeFullscreenStarted = () => updateFullscreen(true);
    const nativeFullscreenEnded = () => updateFullscreen(false);
    ownerDocument.addEventListener('fullscreenchange', fullscreenChanged);
    video.addEventListener('webkitbeginfullscreen', nativeFullscreenStarted);
    video.addEventListener('webkitendfullscreen', nativeFullscreenEnded);
    trigger.disabled = !video.requestFullscreen && !video.webkitEnterFullscreen;
    return {
        relocate() {
            ownerDocument.removeEventListener(
                'fullscreenchange',
                fullscreenChanged,
            );
            ownerDocument = video.ownerDocument;
            ownerDocument.addEventListener(
                'fullscreenchange',
                fullscreenChanged,
            );
        },
        async open() {
            video.controls = true;
            try {
                if (video.requestFullscreen) await video.requestFullscreen();
                else if (video.webkitEnterFullscreen)
                    video.webkitEnterFullscreen();
                else throw new Error('Fullscreen is unavailable');
            } catch {
                updateFullscreen(false);
                reportError(
                    'Video fullscreen could not be opened. Download the file to open it in another app.',
                );
            }
        },
        destroy() {
            ownerDocument.removeEventListener(
                'fullscreenchange',
                fullscreenChanged,
            );
            video.removeEventListener(
                'webkitbeginfullscreen',
                nativeFullscreenStarted,
            );
            video.removeEventListener(
                'webkitendfullscreen',
                nativeFullscreenEnded,
            );
            if (ownerDocument.fullscreenElement === video)
                void ownerDocument.exitFullscreen().catch(() => {});
            video.controls = false;
        },
    };
}
