export type EditorDocument = {
    type: string;
    attrs?: Record<string, unknown>;
    text?: string;
    marks?: { type: string; attrs?: Record<string, unknown> }[];
    content?: EditorDocument[];
};

export type UploadedAttachment = {
    id: number;
    name: string;
    mime_type: string;
    size_bytes: number;
    url: string;
};

export function documentUrl(workspaceId: number, nodeId: number): string {
    return `/workspaces/${workspaceId}/documents/${nodeId}`;
}

export function attachmentUrl(
    workspaceId: number,
    nodeId: number,
    attachmentId: number,
): string {
    return `${documentUrl(workspaceId, nodeId)}/attachments/${attachmentId}`;
}

export function csrfToken(): string {
    return (
        document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
            ?.content ?? ''
    );
}

export async function uploadAttachment(
    workspaceId: number,
    nodeId: number,
    file: File,
): Promise<UploadedAttachment> {
    const body = new FormData();
    body.append('file', file);
    const response = await fetch(
        `${documentUrl(workspaceId, nodeId)}/attachments`,
        {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': csrfToken(),
                Accept: 'application/json',
            },
            body,
        },
    );
    if (!response.ok) {
        throw new Error(
            response.status === 413
                ? 'The file exceeds the upload limit.'
                : 'The file could not be uploaded.',
        );
    }
    return (await response.json()) as UploadedAttachment;
}
