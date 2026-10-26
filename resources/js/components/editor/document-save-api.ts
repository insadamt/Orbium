import type { EditorDocument } from './editor-api';
import { csrfToken, documentUrl } from './editor-api';
import { DocumentSaveError } from './document-save-error';

export async function saveLegacyDocument(
    workspaceId: number,
    nodeId: number,
    content: EditorDocument,
    revision: number,
) {
    const body = JSON.stringify({
        content,
        revision,
        editor_features: { mindmap: 5, inline_icons: 2 },
    });
    if (new TextEncoder().encode(JSON.stringify(content)).length > 1048576)
        throw new DocumentSaveError('Document content exceeds 1 MiB.');
    const response = await fetch(documentUrl(workspaceId, nodeId), {
        method: 'PUT',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken(),
        },
        body,
    });
    const result = (await response.json().catch(() => null)) as {
        revision?: number;
        message?: string;
        errors?: Record<string, string[]>;
    } | null;
    if (!response.ok)
        throw new DocumentSaveError(
            Object.values(result?.errors ?? {}).flat()[0] ??
                result?.message ??
                'Could not save this document.',
            response.status,
            response.status === 409 ||
                Boolean(
                    result?.errors?.revision ||
                    result?.errors?.content_format_version,
                ),
        );
    if (
        !Number.isSafeInteger(result?.revision) ||
        result?.revision !== revision + 1
    )
        throw new DocumentSaveError(
            'Invalid save response. Your local draft is kept.',
        );
    return result.revision;
}
