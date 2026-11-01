// Summary: Saves immutable owner snapshots and guards navigation while content or a rejected rich draft is pending; depends on revision-checked persistence, document activity and hosted sessions.
import { useHostedDocumentSession } from '../hosted-document-session';
import type { Text } from '@codemirror/state';
import { router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDocumentTab } from '@/components/navigation/document-tab-context';
import { useNavigation } from '@/components/navigation/navigation-store';
import { saveMarkdown, type MarkdownLimits } from './markdown-api';
import {
    acknowledgeV3MoveSave,
    updateV3MoveReceivingSnapshot,
    v3MoveSaveMustWait,
    v3PersistenceHost,
    v3MoveSavedEvent,
} from './runtime/v3-move-persistence';

type AutosaveOptions = {
    workspaceId: number;
    nodeId: number;
    revision: number;
    limits: MarkdownLimits;
    isComposing: () => boolean;
    hasPendingDraft?: () => boolean;
};

export function useMarkdownAutosave(options: AutosaveOptions) {
    const { tabId, active } = useDocumentTab();
    const hostedSession = useHostedDocumentSession();
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
    const hasPendingDraft = useRef(options.hasPendingDraft);
    hasPendingDraft.current = options.hasPendingDraft;
    const stopped = useRef(false);
    const timer = useRef<number | undefined>(undefined);
    const dirtySince = useRef<number | null>(null);
    const flushAfterRequest = useRef(false);
    const { workspaceId, nodeId, limits } = options;

    const flush = useCallback(async () => {
        clearTimeout(timer.current);
        if (hasPendingDraft.current?.()) {
            setStatus('error');
            setError(
                'A rich editor contains an unsaved draft. Copy or resolve it before leaving.',
            );
            return;
        }
        if (stopped.current) return;
        if (pendingSource.current === null) {
            if (!requestInFlight.current) {
                setStatus('saved');
                setError('');
                setNavigationNotice('');
            }
            return;
        }
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
        if (v3MoveSaveMustWait({ workspaceId, nodeId }, source)) {
            setStatus('unsaved');
            setNavigationNotice(
                'Waiting for the other document to save the moved blocks. Keep both documents open and resolve any save error there.',
            );
            timer.current = window.setTimeout(() => void flush(), 1000);
            return;
        }
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
            acknowledgeV3MoveSave({ workspaceId, nodeId }, source);
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
            updateV3MoveReceivingSnapshot({ workspaceId, nodeId }, source);
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
        [flush, workspaceId, nodeId],
    );

    useEffect(() => {
        stopped.current = false;
        const isDirty = () =>
            pendingSource.current !== null ||
            requestInFlight.current ||
            Boolean(hasPendingDraft.current?.());
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
        const releaseMoveSave = () => {
            if (pendingSource.current !== null) void flush();
        };
        const persistenceHost = v3PersistenceHost();
        persistenceHost.addEventListener(v3MoveSavedEvent, releaseMoveSave);
        return () => {
            stopped.current = true;
            clearTimeout(timer.current);
            removeGuard();
            window.removeEventListener('beforeunload', beforeUnload);
            window.removeEventListener('orbium:before-tab-close', beforeClose);
            persistenceHost.removeEventListener(
                v3MoveSavedEvent,
                releaseMoveSave,
            );
        };
    }, [flush, tabId]);

    return (
        hostedSession ?? {
            status,
            error,
            navigationNotice,
            queueSave,
            saveNow: flush,
        }
    );
}
