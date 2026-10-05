import type { Node } from '@tiptap/pm/model';

export function autosaveDelay(document: Node): number {
    if (document.childCount >= 600 || document.content.size >= 120_000)
        return 2200;
    if (document.childCount >= 200 || document.content.size >= 40_000)
        return 1300;
    return 700;
}

export function scheduleAutosave(
    document: Node,
    dirtySince: number,
    save: () => void,
): () => void {
    let idle: number | undefined;
    let fallback: number | undefined;
    const remainingDeadline = Math.max(
        0,
        10_000 - (performance.now() - dirtySince),
    );
    const timer = window.setTimeout(
        () => {
            if (typeof requestIdleCallback === 'function') {
                idle = requestIdleCallback(save, {
                    timeout: Math.min(
                        800,
                        Math.max(
                            1,
                            remainingDeadline - autosaveDelay(document),
                        ),
                    ),
                });
            } else fallback = window.setTimeout(save, 0);
        },
        Math.min(autosaveDelay(document), remainingDeadline),
    );
    return () => {
        clearTimeout(timer);
        if (idle !== undefined) cancelIdleCallback(idle);
        if (fallback !== undefined) clearTimeout(fallback);
    };
}
