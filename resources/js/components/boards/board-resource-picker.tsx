import { useEffect, useRef, useState } from 'react';
import { FileText } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/navigation/navigation-dialog';
import { useBoardPageSearch } from './use-board-page-search';
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
    const [after, setAfter] = useState(0);
    const [selected, setSelected] = useState(0);
    const [creationError, setCreationError] = useState('');
    const { resources, next, loading, error } = useBoardPageSearch({
        ...location,
        query,
        after,
        documentsOnly: true,
        enabled: open,
    });
    const [title, setTitle] = useState('');
    const [creating, setCreating] = useState(false);
    const [requestId, setRequestId] = useState(() => crypto.randomUUID());
    const effectiveTitle = pendingTitle ?? title;
    const creatingRef = useRef(false);
    const resultsId = `board-page-results-${location.boardId}`;
    useEffect(() => {
        if (open)
            document
                .getElementById(`${resultsId}-${selected}`)
                ?.scrollIntoView({ block: 'nearest' });
    }, [open, resultsId, selected]);
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
                <DialogTitle>Add an inline Document</DialogTitle>
                <p className="text-xs text-muted-foreground">
                    Documents appear as editable content on the canvas. Type @
                    in a text block to mention a page.
                </p>
                <input
                    autoFocus
                    aria-label="Find a Document"
                    role="combobox"
                    aria-expanded={open}
                    aria-controls={resultsId}
                    aria-autocomplete="list"
                    aria-activedescendant={
                        resources[selected]
                            ? `${resultsId}-${selected}`
                            : undefined
                    }
                    placeholder="Search Documents…"
                    maxLength={120}
                    value={query}
                    disabled={creating}
                    onKeyDown={(event) => {
                        if (event.nativeEvent.isComposing) return;
                        if (
                            event.key === 'ArrowDown' ||
                            event.key === 'ArrowUp'
                        ) {
                            event.preventDefault();
                            const delta = event.key === 'ArrowDown' ? 1 : -1;
                            setSelected(
                                (index) =>
                                    (index +
                                        delta +
                                        Math.max(1, resources.length)) %
                                    Math.max(1, resources.length),
                            );
                        }
                        if (event.key === 'Enter' && resources[selected]) {
                            event.preventDefault();
                            if (onInsert(resources[selected].id)) onClose();
                        }
                    }}
                    onChange={(event) => {
                        setQuery(event.target.value);
                        setAfter(0);
                        setSelected(0);
                    }}
                />
                {(error || creationError) && (
                    <p role="alert" className="text-sm text-destructive">
                        {creationError || error}
                    </p>
                )}
                <div
                    className="board-resource-results"
                    role="listbox"
                    id={resultsId}
                    aria-label="Matching Documents"
                >
                    {resources.map((resource, index) => {
                        return (
                            <button
                                type="button"
                                key={resource.id}
                                role="option"
                                id={`${resultsId}-${index}`}
                                aria-selected={selected === index}
                                data-highlighted={selected === index}
                                onPointerMove={() => setSelected(index)}
                                disabled={creating}
                                onClick={() => {
                                    if (onInsert(resource.id)) onClose();
                                }}
                            >
                                <FileText size={17} />
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
                            No matching Documents. Try another title or create a
                            Document below.
                        </p>
                    )}
                    {loading && <p role="status">Loading Documents…</p>}
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
                <details
                    className="board-page-create"
                    open={pendingTitle ? true : undefined}
                >
                    <summary>Create a Document</summary>
                    <form
                        className="board-new-document"
                        onSubmit={async (event) => {
                            event.preventDefault();
                            if (creatingRef.current || !effectiveTitle.trim())
                                return;
                            creatingRef.current = true;
                            setCreating(true);
                            setCreationError('');
                            try {
                                if (
                                    await onCreate(
                                        effectiveTitle.trim(),
                                        requestId,
                                    )
                                ) {
                                    setTitle('');
                                    setRequestId(crypto.randomUUID());
                                    onClose();
                                }
                            } catch (failure) {
                                setCreationError(
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
                                An earlier creation was not confirmed. Retry it
                                to locate the original Document safely.
                            </p>
                        )}
                        <label htmlFor="board-new-document-title">
                            Document title
                        </label>
                        <p className="text-xs text-muted-foreground">
                            It will be created beside this Board in its folder
                            or workspace root.
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
                            {creating ? 'Creating…' : 'Create and add inline'}
                        </button>
                    </form>
                </details>
            </DialogContent>
        </Dialog>
    );
}
