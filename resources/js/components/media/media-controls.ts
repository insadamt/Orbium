import { widgetIcon } from '@/components/editor/markdown/rich/widget-icons';

export function mediaIconButton(
    label: string,
    icon: Parameters<typeof widgetIcon>[0],
    action: () => void,
) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'attachment-action';
    button.title = label;
    button.setAttribute('aria-label', label);
    button.append(widgetIcon(icon, 17));
    button.addEventListener('click', action);
    return button;
}

export function formatMediaTime(value: number) {
    if (!Number.isFinite(value) || value < 0) return '0:00';
    const seconds = Math.floor(value);
    const hours = Math.floor(seconds / 3600);
    return `${hours ? `${hours}:` : ''}${hours ? String(Math.floor(seconds / 60) % 60).padStart(2, '0') : Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function mountPlaybackControls(
    media: HTMLMediaElement,
    reportError: () => void,
) {
    const root = document.createElement('div');
    root.className = 'attachment-playback-controls';
    const play = mediaIconButton('Play', 'play', togglePlayback);
    play.classList.add('attachment-play-button');
    const progress = document.createElement('input');
    progress.type = 'range';
    progress.className = 'attachment-progress';
    progress.min = '0';
    progress.max = '1';
    progress.step = '0.1';
    progress.value = '0';
    progress.disabled = true;
    progress.setAttribute('aria-label', 'Seek');
    const time = document.createElement('span');
    time.className = 'attachment-time';
    time.textContent = '0:00 / 0:00';
    const mute = mediaIconButton('Mute', 'volume', () => {
        media.muted = !media.muted;
    });
    const volume = document.createElement('input');
    volume.type = 'range';
    volume.className = 'attachment-volume';
    volume.min = '0';
    volume.max = '1';
    volume.step = '0.05';
    volume.value = String(media.volume);
    volume.setAttribute('aria-label', 'Volume');
    const listeners: [string, () => void][] = [];
    function listen(event: string, handler: () => void) {
        media.addEventListener(event, handler);
        listeners.push([event, handler]);
    }
    function togglePlayback() {
        if (!media.paused) media.pause();
        else void media.play().catch(reportError);
    }
    function updateProgress() {
        const duration = Number.isFinite(media.duration) ? media.duration : 0;
        progress.max = String(duration || 1);
        progress.disabled = duration <= 0;
        progress.value = String(media.currentTime);
        progress.style.setProperty(
            '--media-progress',
            `${duration ? (media.currentTime / duration) * 100 : 0}%`,
        );
        progress.setAttribute(
            'aria-valuetext',
            `${formatMediaTime(media.currentTime)} of ${formatMediaTime(duration)}`,
        );
        time.textContent = `${formatMediaTime(media.currentTime)} / ${formatMediaTime(duration)}`;
    }
    function updatePlayback() {
        const paused = media.paused || media.ended;
        play.replaceChildren(widgetIcon(paused ? 'play' : 'pause', 18));
        play.title = paused ? 'Play' : 'Pause';
        play.setAttribute('aria-label', play.title);
        root.dataset.playing = String(!paused);
    }
    for (const event of [
        'timeupdate',
        'durationchange',
        'loadedmetadata',
        'emptied',
    ])
        listen(event, updateProgress);
    for (const event of ['play', 'pause', 'ended'])
        listen(event, updatePlayback);
    listen('volumechange', () => {
        mute.replaceChildren(
            widgetIcon(
                media.muted || media.volume === 0 ? 'volumeMuted' : 'volume',
                17,
            ),
        );
        mute.title = media.muted ? 'Unmute' : 'Mute';
        mute.setAttribute('aria-label', mute.title);
        volume.value = String(media.muted ? 0 : media.volume);
    });
    progress.addEventListener('input', () => {
        if (Number.isFinite(media.duration))
            media.currentTime = Number(progress.value);
        updateProgress();
    });
    volume.addEventListener('input', () => {
        media.volume = Number(volume.value);
        media.muted = media.volume === 0;
    });
    root.append(play, progress, time, mute, volume);
    return {
        root,
        togglePlayback,
        destroy() {
            listeners.forEach(([event, handler]) =>
                media.removeEventListener(event, handler),
            );
        },
    };
}
