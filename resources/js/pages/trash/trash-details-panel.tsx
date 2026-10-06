import * as Dialog from '@radix-ui/react-dialog';
import {
    ChevronRight,
    Loader2,
    MoreHorizontal,
    RotateCcw,
    Trash2,
    X,
} from 'lucide-react';
import * as Menu from '@radix-ui/react-dropdown-menu';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { TrashEntryAvatar } from './trash-entry-avatar';
import { fetchTrashData, formatStorageSize } from './trash-types';
import type { TrashChild, TrashDetails, TrashEntry } from './trash-types';

type Props = {
    entry: TrashEntry;
    busy: boolean;
    onClose: () => void;
    onReturnFocus: () => void;
    onRestore: (entry: TrashEntry) => void;
    onDelete: (keys: string[]) => void;
};

export function TrashDetailsPanel({
    entry,
    busy,
    onClose,
    onReturnFocus,
    onRestore,
    onDelete,
}: Props) {
    const openingConfirmation = useRef(false);
    const [details, setDetails] = useState<TrashDetails | null>(null);
    const [error, setError] = useState('');
    const [expanded, setExpanded] = useState<string[]>([]);
    const [loadingChild, setLoadingChild] = useState<string | null>(null);
    const pending = busy || loadingChild !== null;

    useEffect(() => {
        const controller = new AbortController();
        void fetchTrashData<TrashDetails>(
            '/trash/details',
            { key: entry.key },
            controller.signal,
        )
            .then(setDetails)
            .catch((failure: unknown) => {
                if (!controller.signal.aborted)
                    setError(
                        failure instanceof Error
                            ? failure.message
                            : 'Could not load preview.',
                    );
            });
        return () => controller.abort();
    }, [entry.key]);

    async function restoreChild(child: TrashChild) {
        setLoadingChild(child.key);
        try {
            const childDetails = await fetchTrashData<TrashDetails>(
                '/trash/details',
                { key: child.key },
            );
            onRestore(childDetails.entry);
        } catch (failure) {
            toast.error(
                failure instanceof Error
                    ? failure.message
                    : 'Could not load item.',
            );
        } finally {
            setLoadingChild(null);
        }
    }

    function renderChildren(parentKey: string, depth: number): ReactNode {
        return details?.children
            .filter((child) => child.parent_key === parentKey)
            .map((child) => {
                const hasChildren = details.children.some(
                    (candidate) => candidate.parent_key === child.key,
                );
                const isExpanded = expanded.includes(child.key);
                return (
                    <li key={child.key}>
                        <div
                            className="trash-child-row"
                            style={{ paddingLeft: depth * 16 }}
                        >
                            {hasChildren ? (
                                <button
                                    type="button"
                                    className="trash-tree-toggle"
                                    aria-expanded={isExpanded}
                                    aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${child.title}`}
                                    onClick={() =>
                                        setExpanded(
                                            isExpanded
                                                ? expanded.filter(
                                                      (key) =>
                                                          key !== child.key,
                                                  )
                                                : [...expanded, child.key],
                                        )
                                    }
                                >
                                    <ChevronRight
                                        size={14}
                                        className={
                                            isExpanded
                                                ? 'trash-chevron-open'
                                                : ''
                                        }
                                    />
                                </button>
                            ) : (
                                <span className="trash-tree-spacer" />
                            )}
                            <TrashEntryAvatar
                                type={child.type}
                                title={child.title}
                            />
                            <span className="trash-child-identity">
                                <strong>{child.title}</strong>
                                {child.explicitly_trashed && (
                                    <small>Separately trashed</small>
                                )}
                            </span>
                            {child.explicitly_trashed && (
                                <Menu.Root modal={false}>
                                    <Menu.Trigger
                                        disabled={pending}
                                        className="trash-control-button trash-icon-button"
                                        aria-label={`Actions for ${child.title}`}
                                    >
                                        {loadingChild === child.key ? (
                                            <Loader2
                                                size={15}
                                                className="trash-spinner"
                                            />
                                        ) : (
                                            <MoreHorizontal size={17} />
                                        )}
                                    </Menu.Trigger>
                                    <Menu.Portal>
                                        <Menu.Content
                                            className="floating-menu workspace-manager-menu"
                                            align="end"
                                            sideOffset={6}
                                            onCloseAutoFocus={(event) => {
                                                if (
                                                    openingConfirmation.current
                                                ) {
                                                    event.preventDefault();
                                                    openingConfirmation.current = false;
                                                }
                                            }}
                                        >
                                            <Menu.Item
                                                className="floating-menu-item"
                                                onSelect={() =>
                                                    void restoreChild(child)
                                                }
                                            >
                                                <RotateCcw size={14} />
                                                Restore
                                            </Menu.Item>
                                            <Menu.Item
                                                className="floating-menu-item text-destructive"
                                                onSelect={() => {
                                                    openingConfirmation.current = true;
                                                    onDelete([child.key]);
                                                }}
                                            >
                                                <Trash2 size={14} />
                                                Delete permanently
                                            </Menu.Item>
                                        </Menu.Content>
                                    </Menu.Portal>
                                </Menu.Root>
                            )}
                        </div>
                        {hasChildren && isExpanded && (
                            <ul>{renderChildren(child.key, depth + 1)}</ul>
                        )}
                    </li>
                );
            });
    }

    const currentEntry = details?.entry ?? entry;
    return (
        <Dialog.Root
            open
            onOpenChange={(open) => {
                if (!open && !pending) onClose();
            }}
        >
            <Dialog.Portal>
                <Dialog.Overlay className="trash-drawer-overlay" />
                <Dialog.Content
                    className="trash-details-drawer"
                    onCloseAutoFocus={(event) => {
                        event.preventDefault();
                        onReturnFocus();
                    }}
                >
                    <header className="trash-drawer-header">
                        <span>Details</span>
                        <Dialog.Close asChild>
                            <button
                                type="button"
                                disabled={pending}
                                className="trash-control-button trash-icon-button"
                                aria-label="Close details"
                            >
                                <X size={18} />
                            </button>
                        </Dialog.Close>
                    </header>
                    <div className="trash-drawer-scroll">
                        <div className="trash-drawer-identity">
                            <TrashEntryAvatar
                                type={currentEntry.type}
                                title={currentEntry.title}
                            />
                            <div>
                                <Dialog.Title>
                                    {currentEntry.title}
                                </Dialog.Title>
                                <Dialog.Description>
                                    {currentEntry.path}
                                </Dialog.Description>
                            </div>
                        </div>
                        <dl className="trash-metadata">
                            <div>
                                <dt>Type</dt>
                                <dd className="capitalize">
                                    {currentEntry.type}
                                </dd>
                            </div>
                            <div>
                                <dt>Deleted</dt>
                                <dd>
                                    {new Date(
                                        currentEntry.deleted_at,
                                    ).toLocaleString()}
                                </dd>
                            </div>
                            {currentEntry.descendant_count > 0 && (
                                <div>
                                    <dt>Contents</dt>
                                    <dd>
                                        {currentEntry.descendant_count} items
                                    </dd>
                                </div>
                            )}
                            <div>
                                <dt>Files</dt>
                                <dd>
                                    {currentEntry.attachment_count} ·{' '}
                                    {formatStorageSize(currentEntry.size_bytes)}
                                </dd>
                            </div>
                        </dl>
                        {error && (
                            <p role="alert" className="trash-error">
                                {error}
                            </p>
                        )}
                        {!details && !error && (
                            <p role="status" className="trash-loading">
                                <Loader2 size={16} className="trash-spinner" />
                                Loading preview…
                            </p>
                        )}
                        {details?.excerpt !== null &&
                            details?.excerpt !== undefined && (
                                <section className="trash-preview">
                                    <h3>Preview</h3>
                                    <p>
                                        {details.excerpt || 'Empty document.'}
                                    </p>
                                </section>
                            )}
                        {details && details.children.length > 0 && (
                            <section className="trash-contents">
                                <h3>Contents</h3>
                                <ul>{renderChildren(entry.key, 0)}</ul>
                            </section>
                        )}
                    </div>
                    <footer className="trash-drawer-footer">
                        <button
                            type="button"
                            className="trash-control-button"
                            disabled={pending}
                            onClick={() => onRestore(currentEntry)}
                        >
                            <RotateCcw size={15} />
                            Restore
                        </button>
                        <button
                            type="button"
                            className="trash-control-button text-destructive"
                            disabled={pending}
                            onClick={() => onDelete([entry.key])}
                        >
                            <Trash2 size={15} />
                            Delete permanently
                        </button>
                    </footer>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
