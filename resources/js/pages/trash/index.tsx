import { Head, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Loader2,
    RotateCcw,
    Trash2,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { usePageSearch } from '@/components/navigation/page-search';
import { TrashActionDialog } from './trash-action-dialog';
import type { TrashAction } from './trash-action-dialog';
import { TrashDetailsPanel } from './trash-details-panel';
import { TrashEntryRow } from './trash-entry-row';
import { TrashPageControls } from './trash-page-controls';
import { useTrashRestoration } from './use-trash-restoration';
import type { TrashEntry, TrashSelection } from './trash-types';

type Props = {
    trashEntries: TrashEntry[];
    trashWorkspaces: { id: number; name: string; trashed: boolean }[];
    initialWorkspaceId: number | null;
    cleanupWarning: string | null;
};

const pageSize = 30;

export default function TrashPage() {
    const {
        trashEntries,
        trashWorkspaces,
        initialWorkspaceId,
        cleanupWarning,
    } = usePage<Props>().props;
    const workspaceId =
        initialWorkspaceId === null ? '' : String(initialWorkspaceId);
    const [type, setType] = useState('');
    const [sort, setSort] = useState('newest');
    const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
    const [detailsEntry, setDetailsEntry] = useState<TrashEntry | null>(null);
    const [action, setAction] = useState<TrashAction | null>(null);
    const [changingScope, setChangingScope] = useState(false);
    const [pageIndex, setPageIndex] = useState(0);
    const detailsTrigger = useRef<HTMLElement | null>(null);
    const suppressDrawerFocus = useRef(false);
    const title = useRef<HTMLHeadingElement>(null);
    const pageSearch = usePageSearch();
    const query = pageSearch.query.trim().toLocaleLowerCase();
    const scopedEntries = useMemo(
        () =>
            trashEntries.filter(
                (entry) =>
                    !workspaceId || String(entry.workspace_id) === workspaceId,
            ),
        [trashEntries, workspaceId],
    );
    const filteredEntries = useMemo(
        () =>
            scopedEntries
                .filter(
                    (entry) =>
                        (!type || entry.type === type) &&
                        (!query ||
                            `${entry.title} ${entry.path} ${entry.workspace_name}`
                                .toLocaleLowerCase()
                                .includes(query)),
                )
                .sort((first, second) => {
                    if (sort === 'title')
                        return (
                            first.title.localeCompare(second.title) ||
                            first.key.localeCompare(second.key)
                        );
                    const difference =
                        Date.parse(second.deleted_at) -
                        Date.parse(first.deleted_at);
                    return (
                        (sort === 'oldest' ? -difference : difference) ||
                        first.key.localeCompare(second.key)
                    );
                }),
        [scopedEntries, type, query, sort],
    );
    const pageCount = Math.max(1, Math.ceil(filteredEntries.length / pageSize));
    const currentPage = Math.min(pageIndex, pageCount - 1);
    const visibleEntries = filteredEntries.slice(
        currentPage * pageSize,
        (currentPage + 1) * pageSize,
    );
    const selectedVisibleCount = visibleEntries.filter((entry) =>
        selectedKeys.includes(entry.key),
    ).length;
    const selectedHiddenCount = selectedKeys.filter(
        (key) => !visibleEntries.some((entry) => entry.key === key),
    ).length;
    const scopeName = trashWorkspaces.find(
        (workspace) => String(workspace.id) === workspaceId,
    )?.name;
    const scopeLabel = workspaceId
        ? `Trash in ${scopeName ?? 'this workspace'}`
        : 'Trash across all workspaces in your account';

    function completeAction() {
        setAction(null);
        setSelectedKeys([]);
        setDetailsEntry(null);
    }

    const restoration = useTrashRestoration({
        onCompleted: completeAction,
        onRequireAncestors: (selection) => {
            suppressDrawerFocus.current = true;
            setDetailsEntry(null);
            setAction({
                kind: 'restore',
                selection,
                scopeLabel: 'Recover this content in its original location',
            });
        },
    });
    const busy =
        action !== null ||
        restoration.restoringKeys.length > 0 ||
        changingScope;

    useEffect(() => {
        setSelectedKeys([]);
        setDetailsEntry(null);
    }, [initialWorkspaceId]);
    useEffect(() => {
        pageSearch.setResultCount(filteredEntries.length);
    }, [filteredEntries.length, pageSearch.setResultCount]);
    useEffect(() => {
        setPageIndex(0);
    }, [workspaceId, type, query, sort]);

    function changeWorkspace(value: string) {
        setChangingScope(true);
        router.get('/trash', value ? { workspace: value } : {}, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => setChangingScope(false),
        });
    }

    function selectionFor(keys: string[], emptyScope = false): TrashSelection {
        return {
            keys,
            empty_scope: emptyScope,
            workspace_id: initialWorkspaceId,
        };
    }

    function requestDeletion(keys: string[], emptyScope = false) {
        suppressDrawerFocus.current = true;
        setDetailsEntry(null);
        setAction({
            kind: 'delete',
            selection: selectionFor(keys, emptyScope),
            scopeLabel: emptyScope
                ? `${scopeLabel}. Search and type filters do not limit Empty Trash.`
                : `${keys.length} selected ${keys.length === 1 ? 'entry' : 'entries'}`,
        });
    }

    function restoreEntry(entry: TrashEntry) {
        void restoration.restoreItems({
            selection: selectionFor([entry.key]),
            ancestorsRequired: entry.restore_ancestors.length > 0,
        });
    }

    function toggleSelection(key: string) {
        setSelectedKeys((current) =>
            current.includes(key)
                ? current.filter((item) => item !== key)
                : [...current, key],
        );
    }

    function toggleVisibleSelection() {
        setSelectedKeys(
            selectedVisibleCount === visibleEntries.length
                ? selectedKeys.filter(
                      (key) =>
                          !visibleEntries.some((entry) => entry.key === key),
                  )
                : [
                      ...new Set([
                          ...selectedKeys,
                          ...visibleEntries.map((entry) => entry.key),
                      ]),
                  ],
        );
    }

    function returnDrawerFocus() {
        if (suppressDrawerFocus.current) return;
        if (detailsTrigger.current?.isConnected) detailsTrigger.current.focus();
        else title.current?.focus();
    }

    return (
        <>
            <Head title="Trash" />
            <div className="floating-body-island floating-trash-island">
                <header className="trash-page-header">
                    <div>
                        <h1 ref={title} tabIndex={-1}>
                            Trash
                        </h1>
                        <p>
                            {filteredEntries.length}{' '}
                            {filteredEntries.length === 1 ? 'entry' : 'entries'}
                            {scopeName
                                ? ` in ${scopeName}`
                                : ' across your workspaces'}
                        </p>
                    </div>
                    <TrashPageControls
                        workspaceId={workspaceId}
                        workspaces={trashWorkspaces}
                        type={type}
                        sort={sort}
                        busy={busy}
                        canEmpty={scopedEntries.length > 0}
                        onWorkspaceChange={changeWorkspace}
                        onTypeChange={(value) => {
                            setType(value);
                            setSelectedKeys([]);
                        }}
                        onSortChange={setSort}
                        onEmpty={() => requestDeletion([], true)}
                    />
                </header>
                {cleanupWarning && (
                    <p role="alert" className="trash-error">
                        {cleanupWarning}
                    </p>
                )}
                {query && (
                    <div className="trash-search-summary">
                        <span>Results for “{pageSearch.query}”</span>
                        <button
                            type="button"
                            className="trash-control-button trash-icon-button"
                            onClick={pageSearch.closeSearch}
                            aria-label="Clear Trash search"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}
                {selectedKeys.length > 0 && (
                    <div
                        className="trash-selection-toolbar"
                        role="region"
                        aria-label="Selected item actions"
                    >
                        <span>
                            {selectedKeys.length} selected
                            {selectedHiddenCount > 0 && (
                                <small>
                                    {' '}
                                    · {selectedHiddenCount} on other pages or
                                    hidden
                                </small>
                            )}
                        </span>
                        <div className="trash-selection-actions">
                            <button
                                type="button"
                                className="trash-control-button"
                                disabled={busy}
                                onClick={() =>
                                    void restoration.restoreItems({
                                        selection: selectionFor(selectedKeys),
                                    })
                                }
                            >
                                {restoration.restoringKeys.length > 0 ? (
                                    <Loader2
                                        size={15}
                                        className="trash-spinner"
                                    />
                                ) : (
                                    <RotateCcw size={15} />
                                )}
                                Restore
                            </button>
                            <button
                                type="button"
                                className="trash-control-button"
                                disabled={busy}
                                onClick={() => requestDeletion(selectedKeys)}
                            >
                                <Trash2 size={15} />
                                Delete permanently
                            </button>
                            <button
                                type="button"
                                className="trash-control-button trash-icon-button"
                                disabled={busy}
                                onClick={() => setSelectedKeys([])}
                                aria-label="Clear selection"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                )}
                {filteredEntries.length > 0 ? (
                    <section aria-label="Trashed entries" aria-busy={busy}>
                        <div className="trash-list-heading">
                            <label>
                                <Checkbox
                                    disabled={busy}
                                    checked={
                                        selectedVisibleCount ===
                                        visibleEntries.length
                                            ? true
                                            : selectedVisibleCount > 0
                                              ? 'indeterminate'
                                              : false
                                    }
                                    onCheckedChange={toggleVisibleSelection}
                                />
                                Select page
                            </label>
                            <span>Deleted</span>
                        </div>
                        <ul className="workspace-manager-rows trash-entry-list">
                            {visibleEntries.map((entry) => (
                                <TrashEntryRow
                                    key={entry.key}
                                    entry={entry}
                                    selected={selectedKeys.includes(entry.key)}
                                    busy={busy}
                                    restoring={restoration.restoringKeys.includes(
                                        entry.key,
                                    )}
                                    onSelect={() => toggleSelection(entry.key)}
                                    onDetails={(trigger) => {
                                        suppressDrawerFocus.current = false;
                                        detailsTrigger.current = trigger;
                                        setDetailsEntry(entry);
                                    }}
                                    onRestore={() => restoreEntry(entry)}
                                    onDelete={() =>
                                        requestDeletion([entry.key])
                                    }
                                />
                            ))}
                        </ul>
                        {pageCount > 1 && (
                            <nav
                                className="trash-pagination"
                                aria-label="Trash pages"
                            >
                                <span>
                                    {currentPage * pageSize + 1}–
                                    {Math.min(
                                        (currentPage + 1) * pageSize,
                                        filteredEntries.length,
                                    )}{' '}
                                    of {filteredEntries.length}
                                </span>
                                <div>
                                    <button
                                        type="button"
                                        className="trash-control-button trash-icon-button"
                                        aria-label="Previous page"
                                        disabled={busy || currentPage === 0}
                                        onClick={() =>
                                            setPageIndex(currentPage - 1)
                                        }
                                    >
                                        <ArrowLeft size={16} />
                                    </button>
                                    <span>
                                        {currentPage + 1} / {pageCount}
                                    </span>
                                    <button
                                        type="button"
                                        className="trash-control-button trash-icon-button"
                                        aria-label="Next page"
                                        disabled={
                                            busy || currentPage + 1 >= pageCount
                                        }
                                        onClick={() =>
                                            setPageIndex(currentPage + 1)
                                        }
                                    >
                                        <ArrowRight size={16} />
                                    </button>
                                </div>
                            </nav>
                        )}
                    </section>
                ) : (
                    <div className="trash-empty-state">
                        <Trash2 size={28} strokeWidth={1.3} />
                        <h2>
                            {scopedEntries.length === 0
                                ? 'Trash is empty'
                                : 'No matching entries'}
                        </h2>
                        <p>
                            {scopedEntries.length === 0
                                ? 'Deleted content will appear here.'
                                : 'Try another search or clear the type filter.'}
                        </p>
                        {scopedEntries.length > 0 && (
                            <button
                                type="button"
                                className="trash-control-button"
                                onClick={() => {
                                    setType('');
                                    pageSearch.closeSearch();
                                }}
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                )}
            </div>
            {detailsEntry && (
                <TrashDetailsPanel
                    key={detailsEntry.key}
                    entry={detailsEntry}
                    busy={busy}
                    onClose={() => setDetailsEntry(null)}
                    onReturnFocus={returnDrawerFocus}
                    onRestore={restoreEntry}
                    onDelete={(keys) => requestDeletion(keys)}
                />
            )}
            {action && (
                <TrashActionDialog
                    action={action}
                    onClose={() => setAction(null)}
                    onCompleted={completeAction}
                />
            )}
        </>
    );
}
