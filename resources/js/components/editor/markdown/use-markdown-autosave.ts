import type { Text } from '@codemirror/state';
import { router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDocumentTab } from '@/components/navigation/document-tab-context';
import { useNavigation } from '@/components/navigation/navigation-store';
import { saveMarkdown, type MarkdownLimits } from './markdown-api';

type AutosaveOptions = {
    workspaceId: number;
    nodeId: number;
    revision: number;
    limits: MarkdownLimits;
    isComposing: () => boolean;
};

export function useMarkdownAutosave(options: AutosaveOptions) {
    const { tabId, active } = useDocumentTab();
    const activeTab = useRef(active);
    activeTab.current = active;
    const [status, setStatus] = useState<
        'saved' | 'unsaved' | 'saving' | 'error'
    >('saved');
    const [error, setError] = useState('');
    const [navigationNotice, setNavigationNotice] = useState('');
    const revision = useRef(options.revision);
    const pendingSource = useRef<Text | null>(null);
    const requestInFlight = useRef(false);
    const isComposing = useRef(options.isComposing);
    isComposing.current = options.isComposing;
    const stopped = useRef(false);
    const timer = useRef<number | undefined>(undefined);
    const dirtySince = useRef<number | null>(null);
    const flushAfterRequest = useRef(false);
    const { workspaceId, nodeId, limits } = options;

    const flush = useCallback(async () => {
        clearTimeout(timer.current);
        if (stopped.current || pendingSource.current === null) return;
        if (isComposing.current()) {
            // EditContext can end composition without another document transaction.
            timer.current = window.setTimeout(() => void flush(), 700);
            return;
        }
        if (requestInFlight.current) {
            flushAfterRequest.current = true;
            return;
        }
        const source = pendingSource.current;
        pendingSource.current = null;
        dirtySince.current = null;
        requestInFlight.current = true;
        setStatus('saving');
        let succeeded = false;
        try {
            revision.current = await saveMarkdown({
                workspaceId,
                nodeId,
                limits,
                source,
                revision: revision.current,
            });
            succeeded = true;
            if (!stopped.current) {
                setError('');
                setStatus(pendingSource.current === null ? 'saved' : 'unsaved');
                if (pendingSource.current === null) setNavigationNotice('');
            }
        } catch (failure) {
            pendingSource.current ??= source;
            dirtySince.current ??= performance.now();
            if (!stopped.current) {
                setStatus('error');
                setError(
                    failure instanceof Error
                        ? failure.message
                        : 'Could not save this document.',
                );
            }
        } finally {
            requestInFlight.current = false;
            if (
                succeeded &&
                pendingSource.current !== null &&
                !stopped.current
            ) {
                const delay = flushAfterRequest.current ? 0 : 700;
                timer.current = window.setTimeout(() => void flush(), delay);
            }
            flushAfterRequest.current = false;
        }
    }, [workspaceId, nodeId, limits]);

    const queueSave = useCallback(
        (source: Text) => {
            // CodeMirror Text is immutable; defer full-source serialization until a save.
            pendingSource.current = source;
            dirtySince.current ??= performance.now();
            setStatus('unsaved');
            setNavigationNotice('');
            clearTimeout(timer.current);
            const delay =
                source.length >= 120_000
                    ? 2200
                    : source.length >= 40_000
                      ? 1300
                      : 700;
            timer.current = window.setTimeout(
                () => void flush(),
                Math.max(
                    0,
                    Math.min(
                        delay,
                        10_000 - (performance.now() - dirtySince.current),
                    ),
                ),
            );
        },
        [flush],
    );

    useEffect(() => {
        stopped.current = false;
        const isDirty = () =>
            pendingSource.current !== null || requestInFlight.current;
        const removeGuard = router.on('before', (event) => {
            if (
                (!activeTab.current ||
                    (tabId && useNavigation.getState().activeId !== tabId)) &&
                event.detail.visit.url.pathname !== '/logout'
            )
                return;
            if (!isDirty()) return;
            setNavigationNotice('Finish saving before leaving this document.');
            void flush();
            return false;
        });
        const beforeUnload = (event: BeforeUnloadEvent) => {
            if (isDirty()) event.preventDefault();
        };
        const beforeClose = (event: Event) => {
            if (
                (event as CustomEvent<{ tabId: string }>).detail.tabId !==
                    tabId ||
                !isDirty()
            )
                return;
            event.preventDefault();
            setNavigationNotice('Finish saving before closing this document.');
            void flush();
        };
        window.addEventListener('beforeunload', beforeUnload);
        window.addEventListener('orbium:before-tab-close', beforeClose);
        return () => {
            stopped.current = true;
            clearTimeout(timer.current);
            removeGuard();
            window.removeEventListener('beforeunload', beforeUnload);
            window.removeEventListener('orbium:before-tab-close', beforeClose);
        };
    }, [flush, tabId]);

    return { status, error, navigationNotice, queueSave, saveNow: flush };
}
