import {
    csrfToken,
    type UploadedAttachment,
} from '@/components/editor/editor-api';

export type LibraryFile = UploadedAttachment & {
    created_at: string;
    available: boolean;
    thumbnail_url: string;
    width: number | null;
    height: number | null;
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

export type LibraryFileDetails = LibraryFile & {
    usage: { id: number; title: string; trashed: boolean; url: string }[];
};

export type LibraryFilters = {
    q: string;
    type: 'all' | 'images' | 'files';
    sort: 'newest' | 'name' | 'size';
};
export type LibraryPageResult = {
    files: LibraryFile[];
    total: number;
    page: number;
    has_more: boolean;
};

export function libraryFilterParams(filters: LibraryFilters) {
    return new URLSearchParams({
        q: filters.q.trim(),
        type: filters.type,
        sort: filters.sort,
    });
}

export function libraryFileLabel(file: LibraryFile) {
    if (isLibraryImage(file)) return 'Image';
    if (file.mime_type === 'application/pdf') return 'PDF';
    const extension = file.name.includes('.')
        ? file.name.split('.').pop()?.toUpperCase()
        : null;
    return extension?.slice(0, 8) || 'FILE';
}

export function uploadLibraryFile(
    workspaceId: number,
    file: File,
    onProgress: (progress: number) => void,
): Promise<UploadedAttachment> {
    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open('POST', `/workspaces/${workspaceId}/library/files`);
        request.setRequestHeader('Accept', 'application/json');
        request.setRequestHeader('X-CSRF-TOKEN', csrfToken());
        request.upload.onprogress = (event) => {
            if (event.lengthComputable)
                onProgress(Math.round((event.loaded / event.total) * 100));
        };
        request.onerror = () =>
            reject(
                new Error(
                    'Upload interrupted. Check your connection and try again.',
                ),
            );
        request.onload = () => {
            let body: {
                errors?: Record<string, string[]>;
                message?: string;
            } & UploadedAttachment;
            try {
                body = JSON.parse(request.responseText) as typeof body;
            } catch {
                reject(new Error('The upload failed. Please try again.'));
                return;
            }
            if (request.status < 200 || request.status >= 300) {
                reject(
                    new Error(
                        Object.values(body.errors ?? {}).flat()[0] ??
                            body.message ??
                            'The file could not be uploaded.',
                    ),
                );
            } else resolve(body);
        };
        const body = new FormData();
        body.append('file', file);
        request.send(body);
    });
}
