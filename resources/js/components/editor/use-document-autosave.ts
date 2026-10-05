import {
    measureEditorWork,
    measureEditorAsync,
    recordEditorDuration,
} from '@/lib/editor-performance';
import { scheduleAutosave } from './autosave-scheduling';
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
    const cancelScheduledSave = useRef<(() => void) | null>(null);
    const dirtySince = useRef<number | null>(null);
    const flushAfterRequest = useRef(false);
    const payloadCache = useRef<{
        content: DocumentSnapshot;
        revision: number;
        body: string;
    } | null>(null);
    const stopped = useRef(false);

    const flush = useCallback(async () => {
        cancelScheduledSave.current?.();
        cancelScheduledSave.current = null;
        if (pendingContent.current === null || stopped.current) return;
        if (activeRequest.current) {
            flushAfterRequest.current = true;
            return;
        }
        const content = pendingContent.current;
        pendingContent.current = null;
        dirtySince.current = null;
        activeRequest.current = true;
        setStatus('saving');
        let succeeded = false;
        try {
            const payloadStarted = performance.now();
            if (
                payloadCache.current?.content !== content ||
                payloadCache.current.revision !== revision.current
            ) {
                const json = measureEditorWork('autosave.to-json', () =>
                    content.toJSON(),
                );
                const body = measureEditorWork('autosave.stringify', () =>
                    JSON.stringify({
                        content: json,
                        revision: revision.current,
                    }),
                );
                payloadCache.current = {
                    content,
                    revision: revision.current,
                    body,
                };
            }
            recordEditorDuration('autosave.payload', payloadStarted);
            const response = await measureEditorAsync('autosave.request', () =>
                fetch(documentUrl(workspaceId, nodeId), {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken(),
                        Accept: 'application/json',
                    },
                    body: payloadCache.current!.body,
                }),
            );
            const serverTiming = response.headers.get('Server-Timing');
            if (serverTiming) {
                for (const match of serverTiming.matchAll(
                    /([\w-]+);dur=([\d.]+)/g,
                )) {
                    recordEditorDuration(
                        `autosave.server.${match[1]}`,
                        performance.now() - Number(match[2]),
                    );
                }
            }
            if (!response.ok) {
                const body = await response.json().catch(() => ({}));
                throw new Error(
                    body.errors?.revision?.[0] ??
                        body.errors?.content?.[0] ??
                        body.message ??
                        'Could not save this document.',
                );
            }
            const result = (await measureEditorAsync('autosave.response', () =>
                response.json(),
            )) as { revision: number };
            revision.current = result.revision;
            succeeded = true;
            setError('');
            setStatus(pendingContent.current ? 'unsaved' : 'saved');
            if (pendingContent.current === null) setNavigationNotice('');
        } catch (failure) {
            if (pendingContent.current === null) {
                pendingContent.current = content;
                dirtySince.current ??= performance.now();
            }
            setError(
                failure instanceof Error
                    ? failure.message
                    : 'Could not save this document.',
            );
            setStatus('error');
        } finally {
            activeRequest.current = false;
            if (pendingContent.current && !stopped.current && succeeded) {
                if (flushAfterRequest.current) {
                    flushAfterRequest.current = false;
                    void flush();
                } else {
                    cancelScheduledSave.current = scheduleAutosave(
                        pendingContent.current,
                        dirtySince.current ?? performance.now(),
                        () => void flush(),
                    );
                }
            } else flushAfterRequest.current = false;
        }
    }, [workspaceId, nodeId]);

    const queueSave = useCallback(
        (content: DocumentSnapshot) => {
            // ProseMirror nodes are immutable, so retries keep the exact snapshot without per-keystroke serialization.
            pendingContent.current = content;
            setStatus('unsaved');
            setNavigationNotice('');
            dirtySince.current ??= performance.now();
            cancelScheduledSave.current?.();
            cancelScheduledSave.current = scheduleAutosave(
                content,
                dirtySince.current,
                () => void flush(),
            );
        },
        [flush],
    );

    const saveNow = useCallback(() => {
        cancelScheduledSave.current?.();
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
            cancelScheduledSave.current?.();
            removeNavigationGuard();
            window.removeEventListener('beforeunload', beforeUnload);
        };
    }, [flush]);

    return { status, error, navigationNotice, queueSave, saveNow };
}
