import { documentUrl } from '../../editor-api';
import type { AttachmentMetadata, RichContext } from './rich-model';

export function richAttachmentUrl(context: RichContext, id: string): string {
    return `${documentUrl(context.workspaceId, context.nodeId)}/attachments/${id}`;
}

export async function loadAttachmentMetadata(
    context: RichContext,
    id: string,
    signal: AbortSignal,
): Promise<AttachmentMetadata> {
    const cached = context.metadata.get(id);
    if (cached) return cached;
    const response = await fetch(`${richAttachmentUrl(context, id)}/metadata`, {
        signal,
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
    });
    if (!response.ok)
        throw new Error(
            'Attachment unavailable. It may have been removed or belong to another workspace.',
        );
    const metadata = (await response.json()) as AttachmentMetadata;
    if (
        String(metadata.id) !== id ||
        typeof metadata.name !== 'string' ||
        typeof metadata.mime_type !== 'string' ||
        !Number.isSafeInteger(metadata.size_bytes) ||
        metadata.size_bytes < 0
    )
        throw new Error('Attachment metadata is invalid.');
    context.metadata.set(id, metadata);
    return metadata;
}

export function isDisplayImage(mime: string): boolean {
    return ['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(
        mime,
    );
}
