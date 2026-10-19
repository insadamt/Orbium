import { csrfToken } from '@/components/editor/editor-api';
import { readBoardSnapshot, BoardSaveError } from './board-api';
import type { BoardLocation, BoardSnapshot, BoardBounds } from './board-types';
import type { BoardResource, ResourceDocument } from './board-resource-types';
export function resourceBaseUrl(location: BoardLocation) {
    return `/workspaces/${location.workspaceId}/boards/${location.boardId}`;
}
export async function resourceResponse(response: Response) {
    const data = (await response.json().catch(() => null)) as {
        message?: string;
        errors?: Record<string, string[]>;
    } | null;
    if (!response.ok)
        throw new BoardSaveError(
            Object.values(data?.errors ?? {}).flat()[0] ??
                data?.message ??
                'Could not load this resource.',
            response.status,
        );
    return data;
}
export function readResource(value: unknown): BoardResource {
    const resource = value as BoardResource | null;
    if (
        !resource ||
        !Number.isSafeInteger(resource.id) ||
        resource.id < 1 ||
        !['document', 'database', 'board'].includes(resource.type) ||
        typeof resource.title !== 'string' ||
        typeof resource.excerpt !== 'string'
    )
        throw new Error('Invalid resource preview.');
    return resource;
}
export async function fetchResourceDocument(
    location: BoardLocation,
    targetId: number,
    signal?: AbortSignal,
): Promise<ResourceDocument> {
    const response = await fetch(
        `${resourceBaseUrl(location)}/resources/${targetId}/document`,
        { headers: { Accept: 'application/json' }, cache: 'no-store', signal },
    );
    const result = (await resourceResponse(
        response,
    )) as ResourceDocument | null;
    if (
        !result ||
        result.id !== targetId ||
        typeof result.title !== 'string' ||
        !Number.isSafeInteger(result.revision) ||
        result.revision < 0 ||
        ![1, 2].includes(result.content_format_version)
    )
        throw new Error('Unsupported Document response.');
    if (
        result.content_format_version === 2 &&
        (typeof result.markdown !== 'string' ||
            !result.markdown_limits?.source_bytes ||
            !result.markdown_limits.line_bytes)
    )
        throw new Error('Document source is unavailable.');
    if (
        result.content_format_version === 1 &&
        (!result.content || result.content.type !== 'doc')
    )
        throw new Error('Document content is unavailable.');
    return result;
}
export type CreateResourceRequest = BoardSnapshot & {
    request_id: string;
    title: string;
    object: BoardBounds & { id: string };
};
export async function createResourceDocument(
    location: BoardLocation,
    payload: CreateResourceRequest,
) {
    const response = await fetch(`${resourceBaseUrl(location)}/documents`, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken(),
        },
        body: JSON.stringify(payload),
    });
    const result = (await resourceResponse(response)) as {
        snapshot: unknown;
        resource: unknown;
    } | null;
    if (!result)
        throw new Error(
            'Invalid creation response. Retry the same request to avoid duplicates.',
        );
    const snapshot = readBoardSnapshot(result.snapshot);
    if (snapshot.revision !== payload.revision + 1)
        throw new BoardSaveError(
            'The Board changed after Document creation. Your current draft is kept; load the latest Board.',
            409,
        );
    return { snapshot, resource: readResource(result.resource) };
}
