import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    HostedDocumentControlsHostContext,
    HostedDocumentActionsContext,
} from '@/components/editor/hosted-document-session';
import { openLocation } from '@/components/navigation/tab-navigation';
import { BoardResourceHeader } from './board-resource-header';
import type { BoardContentProps } from './board-text-block';
import { useBoardResourcePreview } from './board-resource-previews';
import { useBoardResourceScroll } from './use-board-resource-scroll';
import { BoardDocumentPreview } from './board-document-preview';
import { BoardDocumentEditor } from './board-document-editor';
import { fetchResourceDocument } from './board-resource-api';
import type { ResourceDocument } from './board-resource-types';

export function BoardResourceBlock(
    props: BoardContentProps & {
        tabId: string;
        onLockedChange: (locked: boolean) => void;
    },
) {
    const targetId = props.object.data.target_node_id!;
    const { preview, refresh } = useBoardResourcePreview(targetId);
    const resource = preview?.resource;
    const location = useMemo(
        () => ({
            workspaceId: props.workspaceId,
            boardId: props.boardId,
            targetId,
            tabId: props.tabId,
        }),
        [props.workspaceId, props.boardId, targetId, props.tabId],
    );
    const [snapshot, setSnapshot] = useState<ResourceDocument | null>(null);
    const previewDocument = useRef<ResourceDocument | null>(null);
    const rememberPreviewDocument = useCallback(
        (document: ResourceDocument) => {
            previewDocument.current = document;
        },
        [],
    );
    const [epoch, setEpoch] = useState(0);
    const [controlsHost, setControlsHost] = useState<HTMLDivElement | null>(
        null,
    );
    const [refreshVersion, setRefreshVersion] = useState(0);
    const [error, setError] = useState('');
    const scroll = useBoardResourceScroll({
        surfaceKey: `${targetId}:${props.editing && Boolean(snapshot)}:${epoch}:${refreshVersion}:${resource?.revision}`,
        editing: props.editing && Boolean(snapshot),
        editPoint: props.editPoint,
    });
    const onLockedChange = props.onLockedChange;
    const locks = useRef({ loading: false, session: false });
    const setLoadingLock = useCallback(
        (locked: boolean) => {
            locks.current.loading = locked;
            onLockedChange(locked || locks.current.session);
        },
        [onLockedChange],
    );
    const setSessionLock = useCallback(
        (locked: boolean) => {
            locks.current.session = locked;
            onLockedChange(locked || locks.current.loading);
        },
        [onLockedChange],
    );
    useEffect(() => {
        if (!props.editing) {
            setSnapshot(null);
            setLoadingLock(false);
            return;
        }
        if (snapshot) return;
        if (resource && resource.type !== 'document') {
            openLocation(resource.url);
            props.onFinish();
            return;
        }
        if (resource?.type !== 'document') return;
        setError('');
        const cached = previewDocument.current;
        if (cached?.id === targetId && cached.revision === resource.revision) {
            setSnapshot(cached);
            return;
        }
        const controller = new AbortController();
        setLoadingLock(true);
        setError('');
        void fetchResourceDocument(location, targetId, controller.signal)
            .then((result) => {
                if (!controller.signal.aborted) setSnapshot(result);
            })
            .catch((failure) => {
                if (!controller.signal.aborted)
                    setError(
                        failure instanceof Error
                            ? failure.message
                            : 'Could not open this Document.',
                    );
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoadingLock(false);
            });
        return () => {
            controller.abort();
            setLoadingLock(false);
        };
    }, [props.editing, resource?.type, targetId, location, setLoadingLock]);
    useEffect(() => () => onLockedChange(false), [onLockedChange]);
    const reload = useCallback((latest: ResourceDocument) => {
        setSnapshot(latest);
        setEpoch((value) => value + 1);
    }, []);
    const finishEditing = () => {
        scroll.rememberScroll();
        props.onFinish();
    };
    const refreshContent = () => {
        scroll.rememberScroll();
        refresh();
        setRefreshVersion((value) => value + 1);
    };
    return (
        <div
            className="board-resource-card"
            data-resource-kind={resource?.type}
            data-editing={props.editing}
            onDoubleClick={(event) => {
                if (resource && resource.type !== 'document') {
                    event.stopPropagation();
                    openLocation(resource.url);
                }
            }}
        >
            <BoardResourceHeader
                resource={resource}
                missing={preview?.missing}
                editing={props.editing}
                editorControlsReady={
                    props.editing && snapshot?.content_format_version === 2
                }
                controlsHost={setControlsHost}
                onEdit={props.onStartEditing}
                onFinish={finishEditing}
                onRefresh={refreshContent}
            />
            <div
                ref={scroll.viewport}
                onScroll={scroll.rememberScroll}
                onPointerDownCapture={scroll.rememberScroll}
                onBlurCapture={scroll.rememberScroll}
                onDoubleClickCapture={scroll.rememberScroll}
                className="board-resource-body"
                aria-busy={props.editing && !snapshot && !error}
                data-board-resource-scroll
                tabIndex={0}
                aria-label="Linked page content"
                onPointerDown={(event) => {
                    //
                    // Let native scrollbar dragging and touch scrolling run without starting a canvas move.
                    //
                    if (
                        event.target === event.currentTarget ||
                        event.pointerType === 'touch'
                    )
                        event.stopPropagation();
                }}
            >
                <div ref={scroll.content}>
                    {!props.editing || !snapshot ? (
                        <div
                            className="board-resource-preview"
                            data-preview-ready={
                                resource?.type !== 'document' &&
                                Boolean(
                                    resource ||
                                    preview?.missing ||
                                    preview?.error,
                                )
                            }
                        >
                            {error && props.editing ? (
                                <p role="alert">{error}</p>
                            ) : null}
                            {preview?.error ? (
                                <p role="alert">{preview.error}</p>
                            ) : preview?.missing ? (
                                <p>
                                    This page was removed or is unavailable.
                                    Removing this card does not delete the
                                    original.
                                </p>
                            ) : resource?.type === 'document' ? (
                                <BoardDocumentPreview
                                    location={location}
                                    resource={resource}
                                    refreshVersion={refreshVersion}
                                    onLoaded={rememberPreviewDocument}
                                />
                            ) : resource ? (
                                <>
                                    <span className="board-resource-kind">
                                        Linked {resource.type}
                                    </span>
                                    <p>
                                        {resource.excerpt ||
                                            'Open the original page in an Orbium tab'}
                                    </p>
                                </>
                            ) : (
                                <p role="status">Loading resource…</p>
                            )}
                        </div>
                    ) : (
                        <HostedDocumentActionsContext.Provider
                            value={{
                                refresh: refreshContent,
                                finish: finishEditing,
                            }}
                        >
                            <HostedDocumentControlsHostContext.Provider
                                value={controlsHost}
                            >
                                <BoardDocumentEditor
                                    key={`${targetId}:${epoch}`}
                                    location={location}
                                    snapshot={snapshot}
                                    onLockedChange={setSessionLock}
                                    onReload={reload}
                                />
                            </HostedDocumentControlsHostContext.Provider>
                        </HostedDocumentActionsContext.Provider>
                    )}
                </div>
            </div>
        </div>
    );
}
