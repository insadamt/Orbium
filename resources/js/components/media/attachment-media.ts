export type AttachmentMediaKind = 'video' | 'audio' | 'pdf';

const videoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
const audioTypes = [
    'audio/mpeg',
    'audio/mp4',
    'audio/x-m4a',
    'audio/ogg',
    'audio/webm',
    'audio/wav',
    'audio/x-wav',
    'audio/flac',
    'audio/x-flac',
    'audio/aac',
];

export function attachmentMediaKind(mime: string): AttachmentMediaKind | null {
    if (videoTypes.includes(mime)) return 'video';
    if (audioTypes.includes(mime)) return 'audio';
    return mime === 'application/pdf' ? 'pdf' : null;
}

export function uploadKindForMime(mime: string) {
    if (['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(mime))
        return 'image' as const;
    return attachmentMediaKind(mime) ?? 'file';
}

export function acceptsUploadKind(kind: string, mime: string) {
    return kind === 'file' || uploadKindForMime(mime) === kind;
}

export function uploadAccept(kind: string): string {
    if (kind === 'video') return videoTypes.join(',');
    if (kind === 'audio') return audioTypes.join(',');
    if (kind === 'pdf') return 'application/pdf';
    if (kind === 'image') return 'image/png,image/jpeg,image/gif,image/webp';
    return '';
}
