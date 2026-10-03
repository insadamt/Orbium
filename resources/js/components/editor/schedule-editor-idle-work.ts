export function scheduleEditorIdleWork(work: () => void): () => void {
    if (typeof window.requestIdleCallback === 'function') {
        const handle = window.requestIdleCallback(work, { timeout: 250 });
        return () => window.cancelIdleCallback(handle);
    }
    const handle = window.setTimeout(work, 16);
    return () => window.clearTimeout(handle);
}
