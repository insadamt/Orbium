import { useEffect, useRef, useState } from 'react';
import { FileText, Database, PanelsTopLeft } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/navigation/navigation-dialog';
import {
    resourceBaseUrl,
    resourceResponse,
    readResource,
} from './board-resource-api';
import type { BoardResource } from './board-resource-types';
import type { BoardLocation } from './board-types';

export function BoardResourcePicker({
    location,
    open,
    onClose,
    onInsert,
    onCreate,
    pendingTitle,
}: {
    location: BoardLocation;
    open: boolean;
    onClose: () => void;
    onInsert: (targetId: number) => boolean;
    onCreate: (title: string, requestId: string) => Promise<boolean>;
    pendingTitle?: string;
}) {
    const [query, setQuery] = useState('');
    const [resources, setResources] = useState<BoardResource[]>([]);
    const [next, setNext] = useState<number | null>(null);
    const [after, setAfter] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [title, setTitle] = useState('');
    const [creating, setCreating] = useState(false);
    const [requestId, setRequestId] = useState(() => crypto.randomUUID());
    const effectiveTitle = pendingTitle ?? title;
    const creatingRef = useRef(false);
    useEffect(() => {
        if (!open) return;
        const controller = new AbortController();
        const timer = window.setTimeout(() => {
            setLoading(true);
            setError('');
            const params = new URLSearchParams({
                q: query,
                after: String(after),
            });
            void fetch(`${resourceBaseUrl(location)}/resources?${params}`, {
                headers: { Accept: 'application/json' },
                cache: 'no-store',
                signal: controller.signal,
            })
                .then(resourceResponse)
                .then((value) => {
                    const data = value as {
                        resources: unknown[];
                        next: number | null;
                    };
                    const result = data.resources.map(readResource);
                    if (controller.signal.aborted) return;
                    setResources((current) =>
                        after
                            ? [
                                  ...current,
                                  ...result.filter(
                                      (item) =>
                                          !current.some(
                                              (previous) =>
                                                  previous.id === item.id,
                                          ),
                                  ),
                              ]
                            : result,
                    );
                    setNext(data.next);
                })
                .catch((failure) => {
                    if (!controller.signal.aborted)
                        setError(
                            failure instanceof Error
                                ? failure.message
                                : 'Could not browse resources.',
                        );
                })
                .finally(() => {
                    if (!controller.signal.aborted) setLoading(false);
                });
        }, 200);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [open, query, after, location]);
    return (
        <Dialog
            open={open}
            onOpenChange={(value) => {
                if (!value && !creatingRef.current) onClose();
            }}
        >
            <DialogContent
                className="board-resource-picker"
                onEscapeKeyDown={(event) => {
                    if (creatingRef.current) event.preventDefault();
                }}
                onPointerDownOutside={(event) => {
                    if (creatingRef.current) event.preventDefault();
                }}
            >
                <DialogTitle>Link a page to this Board</DialogTitle>
                <p className="text-xs text-muted-foreground">
                    The page keeps its current parent. Removing a card keeps the
                    original.
                </p>
                <input
                    autoFocus
                    aria-label="Find a resource"
                    placeholder="Find a Document, Database or Board…"
                    maxLength={120}
                    value={query}
                    disabled={creating}
                    onChange={(event) => {
                        setQuery(event.target.value);
                        setAfter(0);
                        setResources([]);
                        setNext(null);
                    }}
                />
                {error && (
                    <p role="alert" className="text-sm text-destructive">
                        {error}
                    </p>
                )}
                <div className="board-resource-results">
                    {resources.map((resource) => {
                        const Icon =
                            resource.type === 'document'
                                ? FileText
                                : resource.type === 'database'
                                  ? Database
                                  : PanelsTopLeft;
                        return (
                            <button
                                type="button"
                                key={resource.id}
                                disabled={creating}
                                onClick={() => {
                                    if (onInsert(resource.id)) onClose();
                                }}
                            >
                                <Icon size={17} />
                                <span>{resource.title}</span>
                                <small>
                                    {resource.type} ·{' '}
                                    {resource.parent_title ?? 'Workspace root'}
                                </small>
                            </button>
                        );
                    })}
                    {!loading && !resources.length && (
                        <p className="text-sm text-muted-foreground">
                            No visible pages found.
                        </p>
                    )}
                    {loading && <p role="status">Loading pages…</p>}
                    {next !== null && (
                        <button
                            type="button"
                            disabled={loading || creating}
                            onClick={() => setAfter(next)}
                        >
                            Load more
                        </button>
                    )}
                </div>
                <form
                    className="board-new-document"
                    onSubmit={async (event) => {
                        event.preventDefault();
                        if (creatingRef.current || !effectiveTitle.trim())
                            return;
                        creatingRef.current = true;
                        setCreating(true);
                        setError('');
                        try {
                            if (
                                await onCreate(effectiveTitle.trim(), requestId)
                            ) {
                                setTitle('');
                                setRequestId(crypto.randomUUID());
                                onClose();
                            }
                        } catch (failure) {
                            setError(
                                failure instanceof Error
                                    ? failure.message
                                    : 'Could not create this Document. Retry the same request.',
                            );
                        } finally {
                            creatingRef.current = false;
                            setCreating(false);
                        }
                    }}
                >
                    {pendingTitle && (
                        <p role="status" className="text-sm">
                            An earlier creation was not confirmed. Retry it to
                            locate the original Document safely.
                        </p>
                    )}
                    <label htmlFor="board-new-document-title">
                        Create a sibling Document
                    </label>
                    <p className="text-xs text-muted-foreground">
                        It will be created beside this Board in its folder or
                        workspace root.
                    </p>
                    <input
                        id="board-new-document-title"
                        placeholder="Document title"
                        maxLength={255}
                        value={effectiveTitle}
                        disabled={creating || Boolean(pendingTitle)}
                        onChange={(event) => setTitle(event.target.value)}
                    />
                    <button
                        type="submit"
                        disabled={creating || !effectiveTitle.trim()}
                    >
                        {creating ? 'Creating…' : 'Create and add card'}
                    </button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
