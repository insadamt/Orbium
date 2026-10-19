import { router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BoardSaveError, fetchBoard, saveBoard } from './board-api';
import {
    downloadBoardDraft,
    readBoardDraft,
    removeBoardDraft,
    writeBoardDraft,
    type BoardRecoveryLocation,
} from './board-recovery';
import type { BoardObject, BoardSnapshot } from './board-types';

export function useBoardAutosave(
    location: BoardRecoveryLocation,
    initial: BoardSnapshot,
    isComposing: () => boolean,
    isNavigationLocked: () => boolean,
) {
    const composing = useRef(isComposing);
    composing.current = isComposing;
    const navigationLocked = useRef(isNavigationLocked);
    navigationLocked.current = isNavigationLocked;
    const [recovery] = useState(() => readBoardDraft(location));
    const recovered = recovery.snapshot;
    const unsupportedDraft = useRef(recovery.unsupportedSource);
    const [startingSnapshot] = useState(recovered ?? initial);
    const revision = useRef(startingSnapshot.revision);
    const pending = useRef<BoardObject[] | null>(recovered?.objects ?? null);
    const latest = useRef(startingSnapshot.objects);
    const inFlight = useRef(false);
    const stopped = useRef(false);
    const conflicted = useRef(
        Boolean(
            unsupportedDraft.current !== undefined ||
            (recovered && recovered.revision !== initial.revision),
        ),
    );
    const timer = useRef<number | undefined>(undefined);
    const draftTimer = useRef<number | undefined>(undefined);
    const dirtySince = useRef<number | null>(null);
    const [status, setStatus] = useState<
        'saved' | 'unsaved' | 'saving' | 'error' | 'loading'
    >(conflicted.current ? 'error' : recovered ? 'unsaved' : 'saved');
    const [error, setError] = useState(
        unsupportedDraft.current !== undefined
            ? 'Your local Board draft has an unsupported or invalid format. Download it before loading the saved Board.'
            : conflicted.current
              ? 'This Board changed since your local draft. Download your draft or load the latest version.'
              : '',
    );
    const [notice, setNotice] = useState(
        recovered ? 'Recovered your unsaved local draft.' : '',
    );
    const [storageWarning, setStorageWarning] = useState('');

    const persistDraft = useCallback(() => {
        // Preserve unknown recovery bytes until the user explicitly chooses the saved Board.

        if (unsupportedDraft.current !== undefined) return;
        const saved = writeBoardDraft(location, {
            format_version: 4,
            revision: revision.current,
            objects: latest.current,
        });
        if (!stopped.current)
            setStorageWarning(
                saved
                    ? ''
                    : 'Local recovery is unavailable. Keep this tab open until Saved.',
            );
    }, [location]);

    const flush = useCallback(async () => {
        clearTimeout(timer.current);
        if (
            stopped.current ||
            inFlight.current ||
            conflicted.current ||
            pending.current === null
        )
            return;
        if (composing.current()) {
            timer.current = window.setTimeout(() => void flush(), 700);
            return;
        }
        const objects = pending.current;
        pending.current = null;
        inFlight.current = true;
        dirtySince.current = null;
        setStatus('saving');
        persistDraft();
        let saved = false;
        try {
            revision.current = await saveBoard(location, {
                format_version: 4,
                revision: revision.current,
                objects,
            });
            saved = true;
            if (!stopped.current) {
                setError('');
                setStatus(pending.current === null ? 'saved' : 'unsaved');
                if (pending.current === null) {
                    clearTimeout(draftTimer.current);
                    removeBoardDraft(location);
                    setNotice('');
                } else persistDraft();
            }
        } catch (failure) {
            pending.current ??= objects;
            conflicted.current =
                failure instanceof BoardSaveError && failure.status === 409;
            if (!stopped.current) {
                setStatus('error');
                setError(
                    failure instanceof Error
                        ? failure.message
                        : 'Could not save this Board. Your draft is kept.',
                );
                persistDraft();
            }
        } finally {
            inFlight.current = false;
            if (saved && pending.current !== null && !stopped.current)
                timer.current = window.setTimeout(() => void flush(), 700);
        }
    }, [location, persistDraft]);

    const queueSave = useCallback(
        (objects: BoardObject[]) => {
            latest.current = objects;
            pending.current = objects;
            dirtySince.current ??= performance.now();
            if (!conflicted.current) setStatus('unsaved');
            setNotice('');
            clearTimeout(draftTimer.current);
            draftTimer.current = window.setTimeout(persistDraft, 150);
            clearTimeout(timer.current);
            if (!conflicted.current)
                timer.current = window.setTimeout(
                    () => void flush(),
                    Math.max(
                        0,
                        Math.min(
                            700,
                            10_000 - (performance.now() - dirtySince.current),
                        ),
                    ),
                );
        },
        [flush, persistDraft],
    );

    const loadLatest = useCallback(async (): Promise<BoardSnapshot | null> => {
        if (inFlight.current) return null;
        setStatus('loading');
        try {
            const snapshot = await fetchBoard(location);
            revision.current = snapshot.revision;
            latest.current = snapshot.objects;
            pending.current = null;
            conflicted.current = false;
            unsupportedDraft.current = undefined;
            clearTimeout(timer.current);
            clearTimeout(draftTimer.current);
            removeBoardDraft(location);
            setError('');
            setNotice('');
            setStatus('saved');
            return snapshot;
        } catch (failure) {
            setError(
                failure instanceof Error
                    ? failure.message
                    : 'Could not load the latest Board.',
            );
            setStatus('error');
            return null;
        }
    }, [location]);

    useEffect(() => {
        stopped.current = false;
        if (pending.current !== null && !conflicted.current)
            timer.current = window.setTimeout(() => void flush(), 0);
        // Creation blocks leaving but must allow the preceding layout save to finish.

        const dirty = () =>
            pending.current !== null ||
            inFlight.current ||
            composing.current() ||
            navigationLocked.current();
        const guard = (event: Event) => {
            if (!dirty()) return;
            event.preventDefault();
            setNotice('Finish saving before leaving this Board.');
            persistDraft();
            void flush();
        };
        const removeGuard = router.on('before', () => {
            if (!dirty()) return;
            guard(new Event('before', { cancelable: true }));
            return false;
        });
        const closeGuard = (event: Event) => {
            if (
                (event as CustomEvent<{ tabId: string }>).detail.tabId ===
                location.tabId
            )
                guard(event);
        };
        const persistBeforeExit = () => {
            if (dirty()) persistDraft();
        };
        const persistWhenHidden = () => {
            if (document.visibilityState === 'hidden') persistBeforeExit();
        };
        const unload = (event: BeforeUnloadEvent) => {
            if (dirty()) {
                persistDraft();
                event.preventDefault();
            }
        };
        window.addEventListener('orbium:before-page-leave', guard);
        window.addEventListener('orbium:before-tab-close', closeGuard);
        window.addEventListener('beforeunload', unload);
        window.addEventListener('pagehide', persistBeforeExit);
        document.addEventListener('visibilitychange', persistWhenHidden);
        return () => {
            persistBeforeExit();
            stopped.current = true;
            clearTimeout(timer.current);
            clearTimeout(draftTimer.current);
            removeGuard();
            window.removeEventListener('orbium:before-page-leave', guard);
            window.removeEventListener('orbium:before-tab-close', closeGuard);
            window.removeEventListener('beforeunload', unload);
            window.removeEventListener('pagehide', persistBeforeExit);
            document.removeEventListener('visibilitychange', persistWhenHidden);
        };
    }, [flush, location.tabId, persistDraft]);

    return {
        recordExternalConflict: (message: string) => {
            conflicted.current = true;
            setStatus('error');
            setError(message);
            persistDraft();
        },
        isClean: () =>
            pending.current === null &&
            !inFlight.current &&
            !conflicted.current,
        currentRevision: () => revision.current,
        adoptSavedSnapshot: (snapshot: BoardSnapshot) => {
            revision.current = snapshot.revision;
            latest.current = snapshot.objects;
            pending.current = null;
            conflicted.current = false;
            clearTimeout(timer.current);
            clearTimeout(draftTimer.current);
            removeBoardDraft(location);
            setStatus('saved');
            setError('');
            setNotice('');
        },
        startingSnapshot,
        status,
        error,
        notice,
        storageWarning,
        queueSave,
        saveNow: flush,
        loadLatest,
        blocked: conflicted.current || status === 'loading',
        downloadDraft: () =>
            downloadBoardDraft(
                unsupportedDraft.current ?? {
                    format_version: 4,
                    revision: revision.current,
                    objects: latest.current,
                },
            ),
    };
}
