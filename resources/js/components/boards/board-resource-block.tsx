import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ArrowUpRight,
    FileText,
    Database,
    PanelsTopLeft,
    RotateCw,
} from 'lucide-react';
import { openLocation } from '@/components/navigation/tab-navigation';
import type { BoardContentProps } from './board-text-block';
import { useBoardResourcePreview } from './board-resource-previews';
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
    const [epoch, setEpoch] = useState(0);
    const [error, setError] = useState('');
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
    const Icon =
        resource?.type === 'database'
            ? Database
            : resource?.type === 'board'
              ? PanelsTopLeft
              : FileText;
    return (
        <div
            className="board-resource-card"
            data-resource-kind={resource?.type}
            onDoubleClick={(event) => {
                if (resource && resource.type !== 'document') {
                    event.stopPropagation();
                    openLocation(resource.url);
                }
            }}
        >
            <div className="board-resource-header">
                {resource?.icon_url ? (
                    <img src={resource.icon_url} alt="" draggable={false} />
                ) : resource?.icon ? (
                    <span>{resource.icon}</span>
                ) : (
                    <Icon size={18} />
                )}
                <strong>
                    {resource?.title ??
                        (preview?.missing
                            ? 'Resource unavailable'
                            : 'Resource card')}
                </strong>
                <button
                    type="button"
                    data-board-interactive
                    aria-label="Refresh resource"
                    title="Refresh resource"
                    onClick={refresh}
                >
                    <RotateCw size={14} />
                </button>
                {resource && (
                    <button
                        type="button"
                        data-board-interactive
                        aria-label="Open original in Orbium tab"
                        title="Open original in Orbium tab"
                        onClick={() => openLocation(resource.url, true)}
                    >
                        <ArrowUpRight size={16} />
                    </button>
                )}
            </div>
            {!props.editing || (!snapshot && resource?.type !== 'document') ? (
                <div className="board-resource-preview">
                    {preview?.error ? (
                        <p role="alert">{preview.error}</p>
                    ) : preview?.missing ? (
                        <p>
                            This page was removed or is unavailable. Removing
                            this card does not delete the original.
                        </p>
                    ) : resource ? (
                        <>
                            <span className="board-resource-kind">
                                Linked {resource.type}
                            </span>
                            <p>
                                {resource.excerpt ||
                                    (resource.type === 'document'
                                        ? 'Empty Document · double-click to edit'
                                        : 'Open the original page in an Orbium tab')}
                            </p>
                        </>
                    ) : (
                        <p role="status">Loading resource…</p>
                    )}
                </div>
            ) : snapshot ? (
                <BoardDocumentEditor
                    key={`${targetId}:${epoch}`}
                    location={location}
                    snapshot={snapshot}
                    onLockedChange={setSessionLock}
                    onReload={reload}
                />
            ) : (
                <div className="board-resource-preview">
                    {error ? (
                        <p role="alert">{error}</p>
                    ) : (
                        <p role="status">Opening original Document…</p>
                    )}
                </div>
            )}
        </div>
    );
}
