// Summary: Validates saved Board input and selects an isolated native Stage experiment before legacy services mount; depends on existing snapshot readers and explicitly gated development controls.

import { lazy, Suspense, useMemo, useState } from 'react';
import { BoardResourcePreviews } from './board-resource-previews';
import { readBoardSnapshot } from './board-api';
import { downloadBoardDraft } from './board-recovery';
import { BoardWorkspace } from './board-workspace';
import type { BoardLocation, BoardSnapshot } from './board-types';
import {
    BoardRendererSelector,
    nativeBoardExperimentEnabled,
    readNativeBoardExperiment,
} from './native-stage/board-renderer-selector';

const BoardNativeWorkspace =
    import.meta.env.DEV || import.meta.env.VITE_BOARD_NATIVE_STAGE === '1'
        ? lazy(() => import('./native-stage/board-native-workspace'))
        : null;

export function BoardCanvas(
    props: BoardLocation & {
        tabId: string;
        snapshot: BoardSnapshot;
    },
) {
    const [native] = useState(readNativeBoardExperiment);
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
        <>
            {nativeBoardExperimentEnabled && (
                <BoardRendererSelector native={native} />
            )}
            {native && BoardNativeWorkspace ? (
                <Suspense
                    fallback={
                        <p role="status">Opening native Stage preview…</p>
                    }
                >
                    <BoardNativeWorkspace
                        baseline={native === 'native-empty'}
                    />
                </Suspense>
            ) : (
                <BoardResourcePreviews location={props}>
                    <BoardWorkspace {...props} snapshot={result.snapshot} />
                </BoardResourcePreviews>
            )}
        </>
    );
}
