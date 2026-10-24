import { scheduleEditorIdleWork } from '@/components/editor/schedule-editor-idle-work';
import { router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    BoardSaveError,
    fetchBoard,
    saveBoard,
    readBoardSnapshot,
    type BoardValidationCache,
} from './board-api';
import {
    downloadBoardDraft,
    readBoardDraft,
    removeBoardDraft,
    writeBoardDraft,
    type BoardRecoveryLocation,
} from './board-recovery';
import type { BoardObject, BoardSnapshot } from './board-types';
import {
    prepareBoardMutation,
    sendBoardMutation,
    type PreparedBoardMutation,
} from './board-mutation-api';
import {
    materializeBoardObjects,
    type BoardObjectSource,
} from './board-record-store';

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
    const baseline = useRef(initial.objects);
    const mutationsEnabled = useRef(initial.mutation_version === 1);
    const retryMutation = useRef<PreparedBoardMutation | null>(null);
    const validationCache = useRef<BoardValidationCache>(new WeakMap());
    const pending = useRef<BoardObjectSource | null>(
        recovered?.objects ?? null,
    );
    const latest = useRef<BoardObjectSource>(startingSnapshot.objects);
    const inFlight = useRef(false);
    const loadingLatest = useRef(false);
    const stopped = useRef(false);
    const conflicted = useRef(
        Boolean(
            unsupportedDraft.current !== undefined ||
            (recovered && recovered.revision !== initial.revision),
        ),
    );
    const timer = useRef<number | undefined>(undefined);
    const draftTimer = useRef<number | undefined>(undefined);
    const cancelIdleDraft = useRef<(() => void) | undefined>(undefined);
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
    const persistedDraft = useRef<{
        revision: number;
        objects: BoardObject[];
    } | null>(null);

    const persistDraft = useCallback(
        (force = true) => {
            clearTimeout(draftTimer.current);
            cancelIdleDraft.current?.();
            cancelIdleDraft.current = undefined;
            // Preserve unknown recovery bytes until the user explicitly chooses the saved Board.

            if (unsupportedDraft.current !== undefined) return;
            const objects = materializeBoardObjects(latest.current);
            //
            // Debounced work can follow a forced write; deduplicate only that optional work so save/error/exit paths still refresh storage.
            //
            if (
                !force &&
                persistedDraft.current?.revision === revision.current &&
                persistedDraft.current.objects === objects
            )
                return;
            const saved = writeBoardDraft(location, {
                format_version: 5,
                revision: revision.current,
                objects,
            });
            if (saved)
                persistedDraft.current = {
                    revision: revision.current,
                    objects,
                };
            if (!stopped.current)
                setStorageWarning(
                    saved
                        ? ''
                        : 'Local recovery is unavailable. Keep this tab open until Saved.',
                );
        },
        [location],
    );

    const flush = useCallback(async () => {
        clearTimeout(timer.current);
        if (
            stopped.current ||
            loadingLatest.current ||
            inFlight.current ||
            conflicted.current ||
            pending.current === null
        )
            return;
        if (composing.current()) {
            timer.current = window.setTimeout(() => void flush(), 700);
            return;
        }
        const retry = retryMutation.current;
        const objects =
            retry?.objects ?? materializeBoardObjects(pending.current);
        if (!retry || materializeBoardObjects(pending.current) === objects)
            pending.current = null;
        inFlight.current = true;
        dirtySince.current = null;
        setStatus('saving');
        persistDraft();
        let saved = false;
        try {
            const snapshot: BoardSnapshot = {
                format_version: 5,
                revision: revision.current,
                objects,
            };
            if (mutationsEnabled.current) {
                readBoardSnapshot(snapshot, false, validationCache.current);
                const mutation =
                    retry ?? prepareBoardMutation(snapshot, baseline.current);
                if (mutation) {
                    retryMutation.current = mutation;
                    revision.current = await sendBoardMutation(
                        location,
                        mutation,
                    );
                }
            } else
                revision.current = await saveBoard(
                    location,
                    snapshot,
                    validationCache.current,
                );
            baseline.current = objects;
            retryMutation.current = null;
            saved = true;
            if (!stopped.current) {
                setError('');
                setStatus(pending.current === null ? 'saved' : 'unsaved');
                if (pending.current === null) {
                    clearTimeout(draftTimer.current);
                    cancelIdleDraft.current?.();
                    removeBoardDraft(location);
                    persistedDraft.current = null;
                    setNotice('');
                } else persistDraft();
            }
        } catch (failure) {
            pending.current ??= objects;
            if (
                failure instanceof BoardSaveError &&
                failure.status >= 400 &&
                failure.status < 500
            )
                retryMutation.current = null;
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
        (source: BoardObjectSource) => {
            latest.current = source;
            pending.current = source;
            dirtySince.current ??= performance.now();
            if (!conflicted.current) setStatus('unsaved');
            setNotice('');
            clearTimeout(draftTimer.current);
            cancelIdleDraft.current?.();
            draftTimer.current = window.setTimeout(() => {
                //
                // Recovery serialization is synchronous; give input/layout priority while keeping a bounded idle timeout.
                //
                cancelIdleDraft.current = scheduleEditorIdleWork(() =>
                    persistDraft(false),
                );
            }, 150);
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
        if (inFlight.current || loadingLatest.current) return null;
        loadingLatest.current = true;
        clearTimeout(timer.current);
        //
        // Confirmed reload must not race a pending autosave; preserve the old draft until the replacement snapshot has arrived.
        //
        persistDraft();
        setStatus('loading');
        try {
            const snapshot = await fetchBoard(location);
            revision.current = snapshot.revision;
            baseline.current = snapshot.objects;
            mutationsEnabled.current = snapshot.mutation_version === 1;
            retryMutation.current = null;
            latest.current = snapshot.objects;
            pending.current = null;
            conflicted.current = false;
            unsupportedDraft.current = undefined;
            clearTimeout(timer.current);
            clearTimeout(draftTimer.current);
            cancelIdleDraft.current?.();
            removeBoardDraft(location);
            persistedDraft.current = null;
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
        } finally {
            loadingLatest.current = false;
        }
    }, [location, persistDraft]);

    useEffect(() => {
        stopped.current = false;
        if (pending.current !== null && !conflicted.current)
            timer.current = window.setTimeout(() => void flush(), 0);
        // Creation blocks leaving but must allow the preceding layout save to finish.

        const dirty = () =>
            pending.current !== null ||
            inFlight.current ||
            loadingLatest.current ||
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
            cancelIdleDraft.current?.();
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
            !loadingLatest.current &&
            !conflicted.current,
        currentRevision: () => revision.current,
        adoptSavedSnapshot: (snapshot: BoardSnapshot) => {
            revision.current = snapshot.revision;
            baseline.current = snapshot.objects;
            mutationsEnabled.current = snapshot.mutation_version === 1;
            retryMutation.current = null;
            latest.current = snapshot.objects;
            pending.current = null;
            conflicted.current = false;
            clearTimeout(timer.current);
            clearTimeout(draftTimer.current);
            cancelIdleDraft.current?.();
            removeBoardDraft(location);
            persistedDraft.current = null;
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
                    format_version: 5,
                    revision: revision.current,
                    objects: materializeBoardObjects(latest.current),
                },
            ),
    };
}
