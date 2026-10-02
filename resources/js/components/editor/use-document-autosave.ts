import type { Node as DocumentSnapshot } from '@tiptap/pm/model';
import { router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { csrfToken, documentUrl } from './editor-api';

export type SaveStatus = 'saved' | 'unsaved' | 'saving' | 'error';

export function useDocumentAutosave(
    workspaceId: number,
    nodeId: number,
    initialRevision: number,
) {
    const [status, setStatus] = useState<SaveStatus>('saved');
    const [error, setError] = useState('');
    const [navigationNotice, setNavigationNotice] = useState('');
    const pendingContent = useRef<DocumentSnapshot | null>(null);
    const revision = useRef(initialRevision);
    const activeRequest = useRef(false);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const stopped = useRef(false);

    const flush = useCallback(async () => {
        if (
            activeRequest.current ||
            pendingContent.current === null ||
            stopped.current
        )
            return;
        const content = pendingContent.current;
        pendingContent.current = null;
        activeRequest.current = true;
        setStatus('saving');
        let succeeded = false;
        try {
            const response = await fetch(documentUrl(workspaceId, nodeId), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    content: content.toJSON(),
                    revision: revision.current,
                }),
            });
            if (!response.ok) {
                const body = await response.json().catch(() => ({}));
                throw new Error(
                    body.errors?.revision?.[0] ??
                        body.errors?.content?.[0] ??
                        body.message ??
                        'Could not save this document.',
                );
            }
            const result = (await response.json()) as { revision: number };
            revision.current = result.revision;
            succeeded = true;
            setError('');
            setStatus(pendingContent.current ? 'unsaved' : 'saved');
            if (pendingContent.current === null) setNavigationNotice('');
        } catch (failure) {
            if (pendingContent.current === null)
                pendingContent.current = content;
            setError(
                failure instanceof Error
                    ? failure.message
                    : 'Could not save this document.',
            );
            setStatus('error');
        } finally {
            activeRequest.current = false;
            if (pendingContent.current && !stopped.current && succeeded) {
                timer.current = setTimeout(() => {
                    void flush();
                }, 700);
            }
        }
    }, [workspaceId, nodeId]);

    const queueSave = useCallback(
        (content: DocumentSnapshot) => {
            // ProseMirror nodes are immutable, so retries keep the exact snapshot without per-keystroke serialization.
            pendingContent.current = content;
            setStatus('unsaved');
            setNavigationNotice('');
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => {
                void flush();
            }, 700);
        },
        [flush],
    );

    const saveNow = useCallback(() => {
        if (timer.current) clearTimeout(timer.current);
        void flush();
    }, [flush]);

    useEffect(() => {
        stopped.current = false;
        const removeNavigationGuard = router.on('before', () => {
            if (pendingContent.current === null && !activeRequest.current)
                return;
            setNavigationNotice('Finish saving before leaving this document.');
            void flush();
            return false;
        });
        const beforeUnload = (event: BeforeUnloadEvent) => {
            if (pendingContent.current || activeRequest.current)
                event.preventDefault();
        };
        window.addEventListener('beforeunload', beforeUnload);
        return () => {
            stopped.current = true;
            if (timer.current) clearTimeout(timer.current);
            removeNavigationGuard();
            window.removeEventListener('beforeunload', beforeUnload);
        };
    }, [flush]);

    return { status, error, navigationNotice, queueSave, saveNow };
}
