import { csrfToken, documentUrl } from './editor-api';
import {
    mermaidRendererVersion,
    type CachedPreview,
} from './mermaid-preview-renderer';

export async function fetchSavedMermaidPreview(
    workspaceId: number,
    nodeId: number,
    source: string,
    signal: AbortSignal,
): Promise<CachedPreview | null> {
    const bytes = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(source),
    );
    const hash = [...new Uint8Array(bytes)]
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
    const response = await fetch(
        `${documentUrl(workspaceId, nodeId)}/mermaid-previews/${hash}?rendererVersion=${encodeURIComponent(mermaidRendererVersion)}`,
        {
            headers: { Accept: 'application/json' },
            signal: AbortSignal.any([signal, AbortSignal.timeout(1500)]),
        },
    );
    return response.ok
        ? ((await response.json()) as { preview: CachedPreview | null }).preview
        : null;
}

export async function persistMermaidPreview(
    workspaceId: number,
    nodeId: number,
    source: string,
    preview: CachedPreview,
    signal: AbortSignal,
): Promise<boolean> {
    const response = await fetch(
        `${documentUrl(workspaceId, nodeId)}/mermaid-previews`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken(),
                Accept: 'application/json',
            },
            signal,
            body: JSON.stringify({
                source,
                ...preview,
                rendererVersion: mermaidRendererVersion,
            }),
        },
    );
    return response.ok;
}
