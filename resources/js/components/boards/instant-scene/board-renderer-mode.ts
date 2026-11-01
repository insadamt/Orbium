// Summary: Resolves renderer overrides without changing the existing default; depends on URL precedence and optional per-tab storage.

export type BoardRendererMode = 'original' | 'instant' | 'konva';

//
// This experimental branch opens the prototype directly for manual review; explicit overrides retain the reference renderer.
//
const defaultBoardRendererMode: BoardRendererMode = 'instant';

export const instantSceneBudgets = {
    textEntries: 1000,
    textBytes: 8 * 1024 * 1024,
    textNodes: 50_000,
    diagramEntries: 128,
    diagramBytes: 8 * 1024 * 1024,
    preparationBatchMs: 4,
    preparationBatchObjects: 8,
    minZoom: 0.5,
    maxZoom: 2,
} as const;

export function readBoardRendererMode(): BoardRendererMode {
    if (typeof window === 'undefined') return defaultBoardRendererMode;
    const requested = new URLSearchParams(window.location.search).get(
        'boardRenderer',
    );
    if (
        requested === 'original' ||
        requested === 'instant' ||
        requested === 'konva'
    )
        return requested;
    try {
        const saved = sessionStorage.getItem('orbium.board.renderer');
        if (saved === 'original' || saved === 'instant' || saved === 'konva')
            return saved;
    } catch {}
    return defaultBoardRendererMode;
}
