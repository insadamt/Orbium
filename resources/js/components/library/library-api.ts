import {
    csrfToken,
    type UploadedAttachment,
} from '@/components/editor/editor-api';

export type LibraryFile = UploadedAttachment & {
    created_at: string;
    available: boolean;
    usage: { id: number; title: string; trashed: boolean; url: string }[];
};

export function isLibraryImage(file: UploadedAttachment) {
    return ['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(
        file.mime_type,
    );
}

export async function libraryRequest<T>(
    url: string,
    options: RequestInit = {},
): Promise<T> {
    const headers = new Headers(options.headers);
    headers.set('Accept', 'application/json');
    headers.set('X-CSRF-TOKEN', csrfToken());
    if (!(options.body instanceof FormData))
        headers.set('Content-Type', 'application/json');
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
            message?: string;
            errors?: Record<string, string[]>;
        } | null;
        throw new Error(
            Object.values(body?.errors ?? {}).flat()[0] ??
                body?.message ??
                'The Library request failed. Please try again.',
        );
    }
    return (await response.json()) as T;
}

export function formatLibrarySize(bytes: number) {
    return bytes < 1024 * 1024
        ? `${(bytes / 1024).toFixed(1)} KB`
        : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
