import {
    beginBoardPerformanceCapture,
    boardCaptureScenarios,
    type BoardPerformanceCaptureResult,
} from './board-performance-capture';
import {
    readBoardPerformanceScene,
    type BoardPerformanceContext,
} from './board-performance-scene';

type Registration = {
    readContext: () => BoardPerformanceContext;
    commits: number;
};
const registrations = new Map<string, Registration>();
let nextScope = 0;
let active:
    | {
          scope: string;
          stop: ReturnType<typeof beginBoardPerformanceCapture>['stop'];
      }
    | undefined;
let lastResult: BoardPerformanceCaptureResult | undefined;

function registration(scope: string) {
    const registered = registrations.get(scope);
    if (!registered) throw new Error('Choose a mounted scope from list().');
    return registered;
}

const diagnostics = {
    scenarios: boardCaptureScenarios,
    list: () => [...registrations.keys()],
    snapshot: (scope: string) =>
        readBoardPerformanceScene(registration(scope).readContext()),
    start: (
        scope: string,
        scenario: (typeof boardCaptureScenarios)[number],
    ) => {
        if (active) throw new Error('Stop the current Board capture first.');
        if (!boardCaptureScenarios.includes(scenario))
            throw new Error('Choose a scenario from scenarios.');
        const registered = registration(scope);
        const capture = beginBoardPerformanceCapture({
            scope,
            scenario,
            readScene: () =>
                readBoardPerformanceScene(registered.readContext()),
            readCommitCount: () => registered.commits,
            onFinished: (result) => {
                lastResult = result;
                active = undefined;
            },
        });
        active = { scope, stop: capture.stop };
    },
    stop: () => active?.stop(),
    result: () => lastResult,
    clear: () => {
        active?.stop();
        lastResult = undefined;
        for (const entry of performance.getEntriesByType('mark')) {
            if (entry.name.startsWith('orbium:board:p0:'))
                performance.clearMarks(entry.name);
        }
        for (const entry of performance.getEntriesByType('measure')) {
            if (entry.name.startsWith('orbium:board:p0:'))
                performance.clearMeasures(entry.name);
        }
    },
};

declare global {
    interface Window {
        __ORBIUM_BOARD_PERF__?: typeof diagnostics;
    }
}

export function registerBoardPerformanceDiagnostics(
    readContext: () => BoardPerformanceContext,
) {
    const scope = `board-${++nextScope}`;
    const registered = { readContext, commits: 0 };
    registrations.set(scope, registered);
    window.__ORBIUM_BOARD_PERF__ = diagnostics;
    return {
        recordCommit: () => {
            registered.commits++;
        },
        dispose: () => {
            if (active?.scope === scope) active.stop('unmounted');
            registrations.delete(scope);
            if (!registrations.size) {
                diagnostics.clear();
                if (window.__ORBIUM_BOARD_PERF__ === diagnostics)
                    delete window.__ORBIUM_BOARD_PERF__;
            }
        },
    };
}
