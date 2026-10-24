import { useMemo } from 'react';
import { BoardResourcePreviews } from './board-resource-previews';
import { readBoardSnapshot } from './board-api';
import { downloadBoardDraft } from './board-recovery';
import { BoardWorkspace } from './board-workspace';
import type { BoardLocation, BoardSnapshot } from './board-types';

export function BoardCanvas(
    props: BoardLocation & {
        tabId: string;
        snapshot: BoardSnapshot;
    },
) {
    const result = useMemo(() => {
        try {
            return { snapshot: readBoardSnapshot(props.snapshot) };
        } catch (error) {
            return {
                error:
                    error instanceof Error
                        ? error.message
                        : 'Board data unavailable.',
            };
        }
    }, [props.snapshot]);
    if (!result.snapshot)
        return (
            <div className="rounded-xl border p-6">
                <p role="alert">{result.error}</p>
                <button
                    type="button"
                    onClick={() =>
                        downloadBoardDraft(
                            JSON.stringify(props.snapshot, null, 2),
                        )
                    }
                >
                    Download original Board data
                </button>
            </div>
        );
    return (
        <BoardResourcePreviews location={props}>
            <BoardWorkspace {...props} snapshot={result.snapshot} />
        </BoardResourcePreviews>
    );
}
