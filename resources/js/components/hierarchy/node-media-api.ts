import {
    csrfToken,
    type UploadedAttachment,
} from '@/components/editor/editor-api';

export function nodeImageUrl(
    workspaceId: number,
    nodeId: number,
    attachmentId: number,
): string {
    return `/workspaces/${workspaceId}/nodes/${nodeId}/images/${attachmentId}`;
}

export async function uploadNodeImage(
    workspaceId: number,
    nodeId: number,
    file: File,
): Promise<UploadedAttachment> {
    const body = new FormData();
    body.append('file', file);
    const response = await fetch(
        `/workspaces/${workspaceId}/nodes/${nodeId}/images`,
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
                ? 'The image exceeds the upload limit.'
                : 'The image could not be uploaded.',
        );
    }
    return (await response.json()) as UploadedAttachment;
}
