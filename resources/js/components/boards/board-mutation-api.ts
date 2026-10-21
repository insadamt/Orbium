import { csrfToken } from '@/components/editor/editor-api';
import {
    BoardSaveError,
    boardContentUrl,
    readBoardResponse,
} from './board-api';
import type { BoardLocation, BoardObject, BoardSnapshot } from './board-types';

export type PreparedBoardMutation = {
    mutationId: string;
    revision: number;
    objects: BoardObject[];
    body: string;
};

export function prepareBoardMutation(
    snapshot: BoardSnapshot,
    baseline: BoardObject[],
): PreparedBoardMutation | null {
    const previous = new Map(baseline.map((object) => [object.id, object]));
    const creates: BoardObject[] = [];
    const updates: BoardObject[] = [];
    for (const object of snapshot.objects) {
        const before = previous.get(object.id);
        if (!before) creates.push(object);
        else if (before !== object) updates.push(object);
        previous.delete(object.id);
    }
    const deletes = [...previous.keys()];
    if (!creates.length && !updates.length && !deletes.length) return null;
    const mutationId = crypto.randomUUID();
    return {
        mutationId,
        revision: snapshot.revision,
        objects: snapshot.objects,
        //
        // Retain the exact serialized request through uncertain failures; newer edits wait behind this idempotent batch.
        //
        body: JSON.stringify({
            format_version: 4,
            mutation_version: 1,
            mutation_id: mutationId,
            revision: snapshot.revision,
            creates,
            updates,
            deletes,
        }),
    };
}

export async function sendBoardMutation(
    location: BoardLocation,
    mutation: PreparedBoardMutation,
) {
    const response = await fetch(boardContentUrl(location), {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-CSRF-TOKEN': csrfToken(),
        },
        body: mutation.body,
    });
    const result = (await readBoardResponse(response)) as {
        revision?: number;
        mutation_id?: string;
    };
    if (
        !Number.isSafeInteger(result?.revision) ||
        result.revision !== mutation.revision + 1 ||
        result.mutation_id !== mutation.mutationId
    )
        throw new BoardSaveError(
            'The mutation response was invalid. Your draft is kept; retry or load the latest Board.',
        );
    return result.revision;
}
