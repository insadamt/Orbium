import { useEffect, useRef } from 'react';
import type { BoardPerformanceContext } from './board-performance-scene';
import type { registerBoardPerformanceDiagnostics } from './board-performance-diagnostics';

export function useBoardPerformanceDiagnostics(
    context: BoardPerformanceContext,
) {
    const latestContext = useRef(context);
    latestContext.current = context;
    const registration = useRef<ReturnType<
        typeof registerBoardPerformanceDiagnostics
    > | null>(null);
    const { viewportRef, objectsRef, cameraRef } = context;
    useEffect(() => {
        if (!import.meta.env.DEV) return;
        try {
            if (sessionStorage.getItem('orbium.board.profile') !== 'true')
                return;
        } catch {
            return;
        }
        let disposed = false;
        //
        // Load diagnostics only on explicit development opt-in so profiling adds no observers or DOM scans to ordinary Boards.
        //
        void import('./board-performance-diagnostics')
            .then((module) => {
                if (disposed) return;
                registration.current =
                    module.registerBoardPerformanceDiagnostics(
                        () => latestContext.current,
                    );
            })
            .catch(() => {
                //
                // Optional diagnostic loading must not interrupt editing when the development server disconnects.
                //
            });
        return () => {
            disposed = true;
            registration.current?.dispose();
            registration.current = null;
        };
    }, [viewportRef, objectsRef, cameraRef]);

    useEffect(() => {
        if (import.meta.env.DEV) registration.current?.recordCommit();
    });
}
