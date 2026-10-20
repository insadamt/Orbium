import {
    validBoardBlockData,
    boardDataBytes,
    containsBoardNul,
} from './board-block-data';
import { convertLegacyBoardObject } from './board-legacy-reader';
import { csrfToken } from '@/components/editor/editor-api';
import {
    boardLimits,
    type BoardLocation,
    type BoardObject,
    type BoardSnapshot,
} from './board-types';

export class BoardSaveError extends Error {
    constructor(
        message: string,
        public status = 0,
    ) {
        super(message);
    }
}

export type BoardValidationCache = WeakMap<
    object,
    { kind: string; valid: boolean; bytes: number }
>;

export function validBoardObjects(
    value: unknown,
    cache?: BoardValidationCache,
): value is BoardObject[] {
    if (!Array.isArray(value) || value.length > boardLimits.objects)
        return false;
    const ids = new Set<string>();
    let bytes = 0;
    return value.every((object: unknown) => {
        if (!object || typeof object !== 'object') return false;
        const item = object as BoardObject;
        if (
            typeof item.id !== 'string' ||
            !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(item.id) ||
            ids.has(item.id.toLowerCase())
        )
            return false;
        ids.add(item.id.toLowerCase());
        if (
            item.content_format_version !== 1 ||
            !item.data ||
            typeof item.data !== 'object'
        )
            return false;
        let validation = cache?.get(item.data);
        if (!validation || validation.kind !== item.block_type) {
            validation = {
                kind: item.block_type,
                valid:
                    validBoardBlockData(item.block_type, item.data) &&
                    !containsBoardNul(item.data),
                bytes: boardDataBytes(item.data),
            };
            cache?.set(item.data, validation);
        }
        if (!validation.valid) return false;
        const sourceBytes = validation.bytes;
        bytes += sourceBytes;
        return (
            sourceBytes <= boardLimits.blockBytes &&
            bytes <= boardLimits.totalBytes &&
            [item.x, item.y, item.width, item.height, item.layer].every(
                Number.isFinite,
            ) &&
            Math.abs(item.x) <= boardLimits.coordinate &&
            Math.abs(item.y) <= boardLimits.coordinate &&
            item.width >= boardLimits.minWidth &&
            item.width <= boardLimits.maxSize &&
            item.height >= boardLimits.minHeight &&
            item.height <= boardLimits.maxSize &&
            Number.isInteger(item.layer) &&
            item.layer >= 0 &&
            item.layer <= 1_000_000
        );
    });
}

export function readBoardSnapshot(
    value: unknown,
    allowLegacyDraft = false,
    validationCache?: BoardValidationCache,
): BoardSnapshot {
    const snapshot = value as {
        format_version?: number;
        revision?: number;
        objects?: unknown[];
    } | null;
    if (
        !snapshot ||
        ![4, ...(allowLegacyDraft ? [1, 2, 3] : [])].includes(
            snapshot.format_version ?? 0,
        ) ||
        !Number.isSafeInteger(snapshot.revision) ||
        snapshot.revision! < 0 ||
        !Array.isArray(snapshot.objects) ||
        snapshot.objects.length > boardLimits.objects
    )
        throw new BoardSaveError(
            'Unsupported Board snapshot. Download the original data before replacing it.',
        );
    if (snapshot.format_version === 1) {
        let bytes = 0;
        for (const value of snapshot.objects) {
            const legacy = value as {
                block_type?: string;
                content_format_version?: number;
                markdown?: string;
            };
            const size =
                typeof legacy?.markdown === 'string'
                    ? new TextEncoder().encode(legacy.markdown).length
                    : Infinity;
            bytes += size;
            if (
                legacy?.block_type !== 'paragraph' ||
                legacy.content_format_version !== 2 ||
                size > 16384 ||
                bytes > 524288
            )
                throw new BoardSaveError(
                    'Invalid format-1 Board draft. Original recovery data is kept.',
                );
        }
    }
    const objects = snapshot.objects
        .flatMap((value) => {
            const object = value as BoardObject;
            if (
                snapshot.format_version !== 4 &&
                object?.block_type === 'resource'
            )
                throw new BoardSaveError(
                    'Resource cards require Board format 4. Original recovery data is kept.',
                );
            if (
                (object as { content_format_version: number })
                    .content_format_version === 2
            )
                return convertLegacyBoardObject(value);
            return [
                {
                    id: object.id,
                    block_type: object.block_type,
                    content_format_version: object.content_format_version,
                    data: object.data,
                    x: object.x,
                    y: object.y,
                    width: object.width,
                    height: object.height,
                    layer: object.layer,
                },
            ];
        })
        .map((object, layer) => ({ ...object, layer }));
    if (!validBoardObjects(objects, validationCache))
        throw new BoardSaveError(
            'This Board exceeds the native block limits or has invalid data. Download the original snapshot for recovery.',
        );
    return { format_version: 4, revision: snapshot.revision!, objects };
}

function contentUrl(location: BoardLocation) {
    return `/workspaces/${location.workspaceId}/boards/${location.boardId}/content`;
}

async function responseData(response: Response): Promise<unknown> {
    const result = (await response.json().catch(() => null)) as {
        message?: string;
        errors?: Record<string, string[]>;
    } | null;
    if (!response.ok)
        throw new BoardSaveError(
            Object.values(result?.errors ?? {}).flat()[0] ??
                result?.message ??
                'Could not save this Board. Your local draft is kept.',
            response.status,
        );
    return result;
}

export async function fetchBoard(
    location: BoardLocation,
): Promise<BoardSnapshot> {
    const response = await fetch(contentUrl(location), {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
    });
    return readBoardSnapshot(await responseData(response));
}

export async function saveBoard(
    location: BoardLocation,
    snapshot: BoardSnapshot,
    validationCache?: BoardValidationCache,
): Promise<number> {
    readBoardSnapshot(snapshot, false, validationCache);
    const response = await fetch(contentUrl(location), {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-CSRF-TOKEN': csrfToken(),
        },
        body: JSON.stringify(snapshot),
    });
    const result = (await responseData(response)) as { revision?: number };
    if (
        !Number.isSafeInteger(result.revision) ||
        result.revision !== snapshot.revision + 1
    )
        throw new BoardSaveError(
            'The save response was invalid. Your local draft is kept; check the latest Board before retrying.',
        );
    return result.revision;
}
