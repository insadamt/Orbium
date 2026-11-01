// Summary: Defaults Boards to the Konva hybrid engine while retaining renderer overrides; depends on URL precedence and optional per-tab storage.

export type BoardRendererMode = 'original' | 'instant' | 'konva';

//
// The user approved Konva as the default; explicit overrides keep both earlier renderers available for comparison and rollback.
//
const defaultBoardRendererMode: BoardRendererMode = 'konva';

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
