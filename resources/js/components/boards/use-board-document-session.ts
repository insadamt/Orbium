import { Text } from '@codemirror/state';
import type { Node } from '@tiptap/pm/model';
import { router } from '@inertiajs/react';
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { saveMarkdown } from '@/components/editor/markdown/markdown-api';
import { saveLegacyDocument } from '@/components/editor/document-save-api';
import { DocumentSaveError } from '@/components/editor/document-save-error';
import type { HostedDocumentSession } from '@/components/editor/hosted-document-session';
import type { EditorDocument } from '@/components/editor/editor-api';
import {
    readDocumentDraft,
    writeDocumentDraft,
    removeDocumentDraft,
    downloadDocumentDraft,
    type DocumentDraft,
} from './board-document-recovery';
import type {
    ResourceDocument,
    ResourceLocation,
} from './board-resource-types';

type Snapshot = { markdown: string } | { content: EditorDocument };
export function useBoardDocumentSession(
    location: ResourceLocation,
    initial: ResourceDocument,
    onLockedChange: (locked: boolean) => void,
) {
    const [recovery] = useState(() => readDocumentDraft(location, initial));
    const [editorDocument] = useState<ResourceDocument>(() =>
        recovery.draft
            ? {
                  ...initial,
                  revision: recovery.draft.revision,
                  ...(initial.content_format_version === 2
                      ? { markdown: recovery.draft.markdown! }
                      : { content: recovery.draft.content! }),
              }
            : initial,
    );
    const revision = useRef(editorDocument.revision);
    const unsupported = useRef(recovery.raw);
    const recoveredConflict = Boolean(
        recovery.raw !== undefined ||
        (recovery.draft && recovery.draft.revision !== initial.revision),
    );
    const conflicted = useRef(recoveredConflict);
    const pending = useRef<(() => Snapshot) | null>(
        recovery.draft
            ? () =>
                  initial.content_format_version === 2
                      ? { markdown: recovery.draft!.markdown! }
                      : { content: recovery.draft!.content! }
            : null,
    );
    const latest = useRef<() => Snapshot>(
        pending.current ??
            (() =>
                editorDocument.content_format_version === 2
                    ? { markdown: editorDocument.markdown }
                    : { content: editorDocument.content }),
    );
    const saving = useRef(false);
    const composing = useRef(false);
    const operations = useRef(new Set<string>());
    const mounted = useRef(false);
    const timer = useRef<number | undefined>(undefined);
    const draftTimer = useRef<number | undefined>(undefined);
    const dirtySince = useRef<number | null>(null);
    const [status, setStatus] = useState<HostedDocumentSession['status']>(
        recoveredConflict ? 'error' : recovery.draft ? 'unsaved' : 'saved',
    );
    const [error, setError] = useState(
        recovery.raw !== undefined
            ? 'An unsupported Document draft is kept. Download it before loading the latest Document.'
            : recoveredConflict
              ? 'This Document changed since your local draft. Download the draft or load the latest Document.'
              : '',
    );
    const [notice, setNotice] = useState(
        recovery.draft ? 'Recovered your local Document draft.' : '',
    );
    const [storageWarning, setStorageWarning] = useState('');
    const [, refresh] = useState(0);
    const lockedNow = useCallback(
        () =>
            Boolean(
                pending.current ||
                saving.current ||
                composing.current ||
                operations.current.size ||
                conflicted.current ||
                unsupported.current !== undefined,
            ),
        [],
    );
    const draft = useCallback(
        (): DocumentDraft => ({
            format_version: 1,
            workspace_id: location.workspaceId,
            node_id: location.targetId,
            revision: revision.current,
            content_format_version: editorDocument.content_format_version,
            ...latest.current(),
        }),
        [
            location.workspaceId,
            location.targetId,
            editorDocument.content_format_version,
        ],
    );
    const persist = useCallback(() => {
        if (unsupported.current !== undefined) return;
        const saved = writeDocumentDraft(location, draft());
        if (mounted.current)
            setStorageWarning(
                saved
                    ? ''
                    : 'Local Document recovery is unavailable. Keep this Board open until the Document is saved.',
            );
    }, [location, draft]);
    const flush = useCallback(async () => {
        clearTimeout(timer.current);
        if (
            !mounted.current ||
            !pending.current ||
            saving.current ||
            conflicted.current
        )
            return;
        if (composing.current || operations.current.size) {
            timer.current = window.setTimeout(() => void flush(), 700);
            return;
        }
        const capture = pending.current;
        const source = capture();
        pending.current = null;
        saving.current = true;
        dirtySince.current = null;
        setStatus('saving');
        persist();
        let succeeded = false;
        try {
            const next =
                'markdown' in source &&
                editorDocument.content_format_version === 2
                    ? await saveMarkdown({
                          workspaceId: location.workspaceId,
                          nodeId: location.targetId,
                          revision: revision.current,
                          source: Text.of(source.markdown.split('\n')),
                          limits: editorDocument.markdown_limits,
                      })
                    : 'content' in source
                      ? await saveLegacyDocument(
                            location.workspaceId,
                            location.targetId,
                            source.content,
                            revision.current,
                        )
                      : (() => {
                            throw new Error('Document content format changed.');
                        })();
            revision.current = next;
            succeeded = true;
            if (mounted.current) {
                setError('');
                setNotice('');
                setStatus(pending.current ? 'unsaved' : 'saved');
                if (!pending.current) {
                    clearTimeout(draftTimer.current);
                    removeDocumentDraft(location);
                } else persist();
            }
            window.dispatchEvent(
                new CustomEvent('orbium:resource-document-saved', {
                    detail: {
                        workspaceId: location.workspaceId,
                        nodeId: location.targetId,
                    },
                }),
            );
        } catch (failure) {
            pending.current ??= capture;
            conflicted.current =
                failure instanceof DocumentSaveError && failure.conflict;
            if (mounted.current) {
                setStatus('error');
                setError(
                    failure instanceof Error
                        ? failure.message
                        : 'Document save failed.',
                );
                persist();
            }
        } finally {
            saving.current = false;
            if (mounted.current) {
                refresh((value) => value + 1);
                if (succeeded && pending.current)
                    timer.current = window.setTimeout(() => void flush(), 700);
            }
        }
    }, [editorDocument, location, persist]);
    const queueSave = useCallback(
        (snapshot: Text | Node) => {
            const capture = (): Snapshot =>
                editorDocument.content_format_version === 2
                    ? { markdown: snapshot.toString() }
                    : {
                          content: (
                              snapshot as Node
                          ).toJSON() as EditorDocument,
                      };
            latest.current = capture;
            pending.current = capture;
            dirtySince.current ??= performance.now();
            if (!conflicted.current) setStatus('unsaved');
            setNotice('');
            clearTimeout(draftTimer.current);
            draftTimer.current = window.setTimeout(persist, 150);
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
        [editorDocument.content_format_version, flush, persist],
    );
    const setBusy = useCallback((operation: string, active: boolean) => {
        if (operations.current.has(operation) === active) return;
        if (active) operations.current.add(operation);
        else operations.current.delete(operation);
        if (mounted.current) refresh((value) => value + 1);
    }, []);
    const setComposing = useCallback((active: boolean) => {
        composing.current = active;
        if (mounted.current) refresh((value) => value + 1);
    }, []);
    const guard = useCallback(
        (event: Event) => {
            if (!lockedNow()) return;
            event.preventDefault();
            setNotice(
                'Finish saving or resolve this Document draft before leaving its card.',
            );
            persist();
            void flush();
        },
        [flush, lockedNow, persist],
    );
    useEffect(() => {
        mounted.current = true;
        if (pending.current && !conflicted.current)
            timer.current = window.setTimeout(() => void flush(), 0);
        const close = (event: Event) => {
            if (
                (event as CustomEvent<{ tabId: string }>).detail.tabId ===
                location.tabId
            )
                guard(event);
        };
        const unload = (event: BeforeUnloadEvent) => {
            if (lockedNow()) {
                persist();
                event.preventDefault();
            }
        };
        const hide = () => {
            if (lockedNow()) persist();
        };
        const removeRouterGuard = router.on('before', (event) => {
            if (lockedNow()) {
                guard(event);
                return false;
            }
        });
        window.addEventListener('orbium:before-page-leave', guard);
        window.addEventListener('orbium:before-tab-close', close);
        window.addEventListener('beforeunload', unload);
        window.addEventListener('pagehide', hide);
        document.addEventListener('visibilitychange', hide);
        return () => {
            if (lockedNow()) persist();
            mounted.current = false;
            clearTimeout(timer.current);
            clearTimeout(draftTimer.current);
            removeRouterGuard();
            window.removeEventListener('orbium:before-page-leave', guard);
            window.removeEventListener('orbium:before-tab-close', close);
            window.removeEventListener('beforeunload', unload);
            window.removeEventListener('pagehide', hide);
            document.removeEventListener('visibilitychange', hide);
        };
    }, [flush, guard, location.tabId, lockedNow, persist]);
    const locked = lockedNow();
    useLayoutEffect(() => {
        onLockedChange(locked);
    }, [locked, onLockedChange]);
    useEffect(() => () => onLockedChange(false), [onLockedChange]);
    const runtime = useMemo<HostedDocumentSession>(
        () => ({
            status,
            error,
            navigationNotice: notice,
            readOnly: conflicted.current || unsupported.current !== undefined,
            queueSave,
            saveNow: flush,
            setBusy,
            setComposing,
            isOperationPending: () => operations.current.size > 0,
        }),
        [status, error, notice, queueSave, flush, setBusy, setComposing],
    );
    return {
        document: editorDocument,
        runtime,
        locked,
        storageWarning,
        isBusy: () =>
            saving.current || composing.current || operations.current.size > 0,
        download: () => downloadDocumentDraft(unsupported.current ?? draft()),
        clearDraft: () => {
            pending.current = null;
            conflicted.current = false;
            unsupported.current = undefined;
            removeDocumentDraft(location);
        },
    };
}
