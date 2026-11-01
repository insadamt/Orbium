// Summary: Gates the independent Stage behind an explicit local development/profile-build selector; depends on existing renderer overrides and full navigation to preserve save guards.

import { readBoardRendererMode } from '../instant-scene/board-renderer-mode';

export const nativeBoardExperimentEnabled =
    import.meta.env.DEV || import.meta.env.VITE_BOARD_NATIVE_STAGE === '1';

export function readNativeBoardExperiment():
    | 'native-stage'
    | 'native-empty'
    | null {
    if (!nativeBoardExperimentEnabled || typeof window === 'undefined')
        return null;
    const requested = new URLSearchParams(window.location.search).get(
        'boardRenderer',
    );
    return requested === 'native-stage' || requested === 'native-empty'
        ? requested
        : null;
}

export function BoardRendererSelector({
    native,
}: {
    native: ReturnType<typeof readNativeBoardExperiment>;
}) {
    return (
        <label className="absolute right-6 bottom-6 z-20 rounded-lg border bg-card p-2 text-xs">
            Dev renderer{' '}
            <select
                aria-label="Development Board renderer"
                value={native ?? readBoardRendererMode()}
                onChange={(event) => {
                    const url = new URL(window.location.href);
                    url.searchParams.set('boardRenderer', event.target.value);
                    window.location.assign(url);
                }}
            >
                <option value="original">Original</option>
                <option value="instant">Instant Scene</option>
                <option value="konva">Konva hybrid</option>
                <option value="native-stage">Native Stage · scratch</option>
                <option value="native-empty">Empty Stage · baseline</option>
            </select>
        </label>
    );
}
