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

export type ContentOwnerKind = 'document' | 'board';

export function contentOwnerUrl(
    workspaceId: number,
    nodeId: number,
    kind: ContentOwnerKind = 'document',
): string {
    return `/workspaces/${workspaceId}/${kind === 'board' ? 'boards' : 'documents'}/${nodeId}`;
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

export async function uploadErrorMessage(
    response: Response,
    fallback: string,
): Promise<string> {
    if (response.status === 413) {
        return 'The file exceeds the 100 MB server upload limit.';
    }

    if (response.status === 422) {
        const body = (await response.json().catch(() => null)) as {
            errors?: { file?: string[] };
        } | null;
        return body?.errors?.file?.[0] ?? fallback;
    }

    return fallback;
}

export async function uploadAttachment(
    workspaceId: number,
    nodeId: number,
    file: File,
    ownerKind: ContentOwnerKind = 'document',
): Promise<UploadedAttachment> {
    const body = new FormData();
    body.append('file', file);
    const response = await fetch(
        `${contentOwnerUrl(workspaceId, nodeId, ownerKind)}/attachments`,
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
            await uploadErrorMessage(
                response,
                'The file could not be uploaded.',
            ),
        );
    }
    return (await response.json()) as UploadedAttachment;
}
