import { useLayoutEffect, useState, type RefObject } from 'react';

type SaveStatus = 'saved' | 'unsaved' | 'saving' | 'error' | 'loading';
export function useMindMapOwnerStatus(
    anchor: RefObject<HTMLElement | null>,
    active: boolean,
) {
    const [status, setStatus] = useState<SaveStatus | null>(null);
    useLayoutEffect(() => {
        if (!active) return;
        //
        // Native, legacy and nested CodeMirror roots share a small DOM status contract without copying save state.
        //
        const owner = anchor.current?.closest<HTMLElement>(
            '[data-mindmap-owner-status]',
        );
        if (!owner) return;
        function synchronizeOwnerStatus() {
            const value = owner!.dataset.mindmapOwnerStatus;
            setStatus(
                ['saved', 'unsaved', 'saving', 'error', 'loading'].includes(
                    value ?? '',
                )
                    ? (value as SaveStatus)
                    : null,
            );
        }
        synchronizeOwnerStatus();
        const observer = new MutationObserver(synchronizeOwnerStatus);
        observer.observe(owner, {
            attributes: true,
            attributeFilter: ['data-mindmap-owner-status'],
        });
        return () => observer.disconnect();
    }, [anchor, active]);
    return status;
}
