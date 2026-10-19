import { readBoardSnapshot } from './board-api';
import {
    boardStorageKey,
    type BoardLocation,
    type BoardSnapshot,
} from './board-types';

export type BoardRecoveryLocation = BoardLocation & { tabId: string };

// Shared navigation preferences can change app-tab IDs on reload; recovery follows the Board.

export function readBoardDraft(location: BoardRecoveryLocation): {
    snapshot: BoardSnapshot | null;
    unsupportedSource?: string;
} {
    let source: string | null = null;
    try {
        source = sessionStorage.getItem(boardStorageKey(location, 'draft.v1'));
        return {
            snapshot: source
                ? readBoardSnapshot(JSON.parse(source), true)
                : null,
        };
    } catch {
        return {
            snapshot: null,
            ...(source !== null ? { unsupportedSource: source } : {}),
        };
    }
}

export function writeBoardDraft(
    location: BoardRecoveryLocation,
    snapshot: BoardSnapshot,
): boolean {
    try {
        sessionStorage.setItem(
            boardStorageKey(location, 'draft.v1'),
            JSON.stringify(snapshot),
        );
        return true;
    } catch {
        return false;
    }
}

export function removeBoardDraft(location: BoardRecoveryLocation) {
    try {
        sessionStorage.removeItem(boardStorageKey(location, 'draft.v1'));
    } catch {
        // Storage availability must not prevent saving on the server.
    }
}

export function downloadBoardDraft(snapshot: BoardSnapshot | string) {
    const url = URL.createObjectURL(
        new Blob(
            [
                typeof snapshot === 'string'
                    ? snapshot
                    : JSON.stringify(snapshot, null, 2),
            ],
            {
                type: 'application/json',
            },
        ),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'orbium-board-local-draft.json';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
