import { ExportDialog } from '@/components/document-transfer/export-dialog';
import { ImportDialog } from '@/components/document-transfer/import-dialog';
import { router } from '@inertiajs/react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/navigation/navigation-dialog';
import { CreateNodeForm } from '@/components/navigation/create-node-form';
import { useNodeFavorite } from '@/components/navigation/use-node-favorite';
import {
    nodeUrl,
    type TreeNode,
} from '@/components/navigation/navigation-types';
import { openLocation } from '@/components/navigation/tab-navigation';
import { useExplorerFilters } from './use-explorer-filters';
import { useContainerView } from '@/components/navigation/use-container-view';
import { ExplorerDragDropTargets } from './explorer-drag-drop-targets';
import { trashExplorerNodes } from './explorer-node-mutations';
import { useExplorerSelection } from './use-explorer-selection';
import { FloatingItem } from './floating-item';
import {
    ExplorerContextMenu,
    type ExplorerMenuPosition,
} from './explorer-context-menu';
import { useExplorerLayoutMotion } from './use-explorer-layout-motion';
import { useItemDrag } from './use-item-drag';
import {
    galleryAppearance,
    ratioNumber,
    type GalleryAppearance,
} from './cover-presentation';
import { GalleryAppearanceDialog } from './gallery-appearance-dialog';
import { MasonryLayout } from './masonry-layout';
import { csrfToken } from '@/components/editor/editor-api';
import {
    ExplorerViewControls,
    type ExplorerView,
} from './explorer-view-controls';
import type { WorkspaceContentsProps } from './workspace-contents-types';

export function WorkspaceContents({
    workspaceId,
    nodes,
    parentId,
    initialGalleryConfig,
}: WorkspaceContentsProps) {
    const contentsRef = useRef<HTMLElement>(null);
    const [appearance, setAppearance] = useState(() =>
        galleryAppearance(initialGalleryConfig),
    );
    const [legacyPreview, setLegacyPreview] = useState(
        Boolean(initialGalleryConfig?.legacy_preview),
    );
    useEffect(() => {
        setAppearance(galleryAppearance(initialGalleryConfig));
        setLegacyPreview(Boolean(initialGalleryConfig?.legacy_preview));
    }, [initialGalleryConfig]);
    const [appearanceDraft, setAppearanceDraft] =
        useState<GalleryAppearance | null>(null);
    const [savingAppearance, setSavingAppearance] = useState(false);
    const [savedView, setView] = useContainerView<ExplorerView>(
        `explorer.${workspaceId}.${parentId ?? 'root'}.view`,
        'grid',
    );
    const view = ['grid', 'list', 'gallery'].includes(savedView)
        ? savedView
        : 'grid';
    useExplorerLayoutMotion(
        contentsRef,
        view !== 'gallery' || appearance.layout !== 'natural',
    );
    const focusId = Number(
        new URLSearchParams(window.location.search).get('focus'),
    );
    const [menuPosition, setMenuPosition] =
        useState<ExplorerMenuPosition | null>(null);
    const [importOpen, setImportOpen] = useState(false);
    const [exportNodeId, setExportNodeId] = useState<number | null>(null);
    const [createType, setCreateType] = useState<TreeNode['type'] | null>(null);
    const [renameId, setRenameId] = useState<number | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [newTitle, setNewTitle] = useState('');
    const [saving, setSaving] = useState(false);
    const [changingHierarchy, setChangingHierarchy] = useState(false);
    const [announcement, setAnnouncement] = useState('');
    const {
        children,
        directChildren,
        sort,
        setSort,
        typeFilter,
        setTypeFilter,
        hasActiveFilter,
    } = useExplorerFilters({ workspaceId, parentId, nodes });
    const canReorder = sort === 'manual';
    const selection = useExplorerSelection(workspaceId, children);
    const menuNode = children.find((node) => node.id === menuPosition?.nodeId);
    const { toggleFavorite, savingFavorite } = useNodeFavorite(
        workspaceId,
        menuNode,
    );
    const deleteNode = nodes.find((node) => node.id === deleteId);
    function move(
        nodeId: number,
        destination: number | null,
        position: number,
    ): Promise<boolean> {
        if (changingHierarchy || selection.busy) return Promise.resolve(false);
        if (selection.selectedIds.includes(nodeId)) {
            return selection.submitBulkAction('move', destination, position);
        }
        setChangingHierarchy(true);
        return new Promise((resolve) => {
            let succeeded = false;
            router.patch(
                `/workspaces/${workspaceId}/nodes/${nodeId}/move`,
                { parent_id: destination, position },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        succeeded = true;
                        setAnnouncement('Item moved.');
                    },
                    onError: (errors) => toast.error(Object.values(errors)[0]),
                    onFinish: () => {
                        setChangingHierarchy(false);
                        resolve(succeeded);
                    },
                },
            );
        });
    }
    function trashDraggedItems(nodeIds: number[]): Promise<boolean> {
        if (changingHierarchy || selection.busy) return Promise.resolve(false);
        setChangingHierarchy(true);
        return trashExplorerNodes({
            workspaceId,
            nodeIds,
            onFinish: () => setChangingHierarchy(false),
        });
    }
    const {
        draggedId,
        liftedIds,
        trashActive,
        moveOutActive,
        dropHint,
        dragHandlers,
    } = useItemDrag(
        nodes,
        move,
        trashDraggedItems,
        changingHierarchy || selection.busy || !canReorder,
        selection.selectedIds,
    );
    const currentFolder = nodes.find((node) => node.id === parentId);
    function openNode(node: TreeNode, newTab: boolean) {
        openLocation(nodeUrl(workspaceId, node), newTab);
    }
    function openActionsAt(nodeId: number | null, target: HTMLElement) {
        const bounds = target.getBoundingClientRect();
        const direction = getComputedStyle(target).direction as 'ltr' | 'rtl';
        setMenuPosition({
            nodeId,
            x: nodeId === null ? bounds.left + bounds.width / 2 : bounds.right,
            y: bounds.bottom,
            direction,
        });
    }
    function rename(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!renameId || !newTitle.trim() || saving) return;
        setSaving(true);
        router.patch(
            `/workspaces/${workspaceId}/nodes/${renameId}`,
            { title: newTitle.trim() },
            {
                preserveScroll: true,
                onSuccess: () => setRenameId(null),
                onError: (errors) => toast.error(Object.values(errors)[0]),
                onFinish: () => setSaving(false),
            },
        );
    }
    function deleteNodeFromExplorer() {
        if (!deleteId || saving) return;
        setSaving(true);
        void trashExplorerNodes({
            workspaceId,
            nodeIds: [deleteId],
            onSuccess: () => setDeleteId(null),
            onFinish: () => setSaving(false),
        });
    }
    async function saveAppearance() {
        if (!appearanceDraft || savingAppearance) return;
        setSavingAppearance(true);
        const path =
            parentId === null
                ? `/workspaces/${workspaceId}/gallery`
                : `/workspaces/${workspaceId}/nodes/${parentId}/gallery`;
        try {
            const response = await fetch(path, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                    Accept: 'application/json',
                },
                body: JSON.stringify(appearanceDraft),
            });
            if (!response.ok)
                throw new Error('Could not save Gallery appearance.');
            setAppearance(appearanceDraft);
            setLegacyPreview(false);
            setAppearanceDraft(null);
        } catch {
            toast.error('Could not save Gallery appearance.');
        } finally {
            setSavingAppearance(false);
        }
    }
    function renderChild(node: TreeNode) {
        return (
            <FloatingItem
                key={node.id}
                workspaceId={workspaceId}
                view={view}
                appearance={appearance}
                legacyPreview={legacyPreview}
                node={node}
                selected={selection.selectedIds.includes(node.id)}
                revealed={focusId === node.id}
                disabled={
                    changingHierarchy || selection.busy || draggedId !== null
                }
                dragging={liftedIds.includes(node.id)}
                placement={
                    dropHint?.targetId === node.id
                        ? dropHint.placement
                        : undefined
                }
                dragHandlers={dragHandlers(node)}
                onSelect={() => selection.toggleSelection(node.id)}
                onOpen={(newTab) => openNode(node, newTab)}
                onActions={(target) => openActionsAt(node.id, target)}
                canReorder={canReorder}
                onReorder={(direction) => {
                    if (!canReorder) return;
                    const position =
                        directChildren.findIndex(
                            (child) => child.id === node.id,
                        ) + direction;
                    if (position >= 0 && position < directChildren.length)
                        void move(node.id, parentId, position);
                }}
            />
        );
    }
    return (
        <>
            <ExplorerDragDropTargets
                workspaceId={workspaceId}
                visible={draggedId !== null}
                active={trashActive}
                count={liftedIds.length}
                busy={changingHierarchy}
                canMoveOut={currentFolder?.type === 'folder'}
                moveOutActive={moveOutActive}
            />
            <ExplorerViewControls
                view={view}
                sort={sort}
                onSortChange={setSort}
                typeFilter={typeFilter}
                onTypeFilterChange={setTypeFilter}
                disabled={
                    changingHierarchy || selection.busy || draggedId !== null
                }
                onChange={setView}
                onGalleryAppearance={() => setAppearanceDraft(appearance)}
            />
            <section
                ref={contentsRef}
                data-workspace-id={workspaceId}
                className="floating-contents"
                data-view={view}
                data-layout={view === 'gallery' ? appearance.layout : undefined}
                aria-label="Current container contents"
                aria-busy={
                    changingHierarchy || selection.busy || draggedId !== null
                }
                onClick={(event) => {
                    if (
                        !(event.target as HTMLElement).closest('[data-node-id]')
                    )
                        selection.clearSelection();
                }}
                tabIndex={0}
                onContextMenu={(event) => {
                    event.preventDefault();
                    const item = (
                        event.target as HTMLElement
                    ).closest<HTMLElement>('[data-node-id]');
                    const nodeId = item ? Number(item.dataset.nodeId) : null;
                    setMenuPosition({
                        nodeId,
                        x: event.clientX,
                        y: event.clientY,
                        direction: getComputedStyle(event.target as Element)
                            .direction as 'ltr' | 'rtl',
                    });
                }}
                onKeyDown={(event) => {
                    if (event.key === 'Escape') selection.clearSelection();
                    if (
                        event.target !== event.currentTarget ||
                        !event.shiftKey ||
                        event.key !== 'F10'
                    )
                        return;
                    event.preventDefault();
                    openActionsAt(null, event.currentTarget);
                }}
            >
                {view === 'gallery' && appearance.layout === 'natural' ? (
                    <MasonryLayout
                        hiddenItemIds={liftedIds}
                        animateExplorerLayout
                        items={children.map((node) => ({
                            ...node,
                            estimatedHeight: (width: number) =>
                                width /
                                    ratioNumber(
                                        node.cover_attachment_id
                                            ? node.cover_aspect_ratio
                                            : '16:9',
                                    ) +
                                70,
                        }))}
                        render={renderChild}
                        minimumWidth={252}
                    />
                ) : (
                    children.map(renderChild)
                )}
            </section>
            {hasActiveFilter && children.length === 0 && (
                <p className="floating-no-results" role="status">
                    No items match your search and filters.
                </p>
            )}
            <p className="sr-only" role="status">
                {announcement}
            </p>
            <ExplorerContextMenu
                position={menuPosition}
                nodeTitle={menuNode?.title}
                isFavorite={menuNode?.is_favorite}
                onToggleFavorite={
                    menuNode && !savingFavorite ? toggleFavorite : undefined
                }
                onClose={() => setMenuPosition(null)}
                onImport={() => setImportOpen(true)}
                onExport={
                    menuNode?.type === 'document'
                        ? () => setExportNodeId(menuNode.id)
                        : undefined
                }
                onCreate={setCreateType}
                onOpen={(newTab) => {
                    if (!menuNode) return;
                    openNode(menuNode, newTab);
                }}
                onRename={() => {
                    if (!menuNode) return;
                    setNewTitle(menuNode.title);
                    setRenameId(menuNode.id);
                }}
                onDelete={() => menuNode && setDeleteId(menuNode.id)}
            />
            {importOpen && (
                <ImportDialog
                    workspaceId={workspaceId}
                    parentId={parentId}
                    onClose={() => setImportOpen(false)}
                />
            )}
            {exportNodeId !== null && (
                <ExportDialog
                    workspaceId={workspaceId}
                    nodeId={exportNodeId}
                    onClose={() => setExportNodeId(null)}
                />
            )}
            <GalleryAppearanceDialog
                draft={appearanceDraft}
                saving={savingAppearance}
                onChange={setAppearanceDraft}
                onClose={() => setAppearanceDraft(null)}
                onSave={() => void saveAppearance()}
            />
            <Dialog
                open={createType !== null}
                onOpenChange={(open) => {
                    if (!open) setCreateType(null);
                }}
            >
                <DialogContent>
                    <DialogTitle>New {createType}</DialogTitle>
                    {createType && (
                        <CreateNodeForm
                            workspaceId={workspaceId}
                            parentId={parentId}
                            type={createType}
                            onCancel={() => setCreateType(null)}
                            onCreated={() => setCreateType(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
            <Dialog
                open={renameId !== null}
                onOpenChange={(open) => !open && setRenameId(null)}
            >
                <DialogContent>
                    <DialogTitle>Rename item</DialogTitle>
                    <form onSubmit={rename} className="space-y-3">
                        <input
                            autoFocus
                            aria-label="Item name"
                            value={newTitle}
                            onChange={(event) =>
                                setNewTitle(event.target.value)
                            }
                            maxLength={255}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2.5"
                        />
                        <button
                            disabled={saving || !newTitle.trim()}
                            className="rounded-lg bg-foreground px-4 py-2 text-background disabled:opacity-40"
                        >
                            {saving ? 'Saving…' : 'Save name'}
                        </button>
                    </form>
                </DialogContent>
            </Dialog>
            <Dialog
                open={deleteId !== null}
                onOpenChange={(open) => !open && setDeleteId(null)}
            >
                <DialogContent>
                    <DialogTitle>Delete “{deleteNode?.title}”?</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        This item will go to Trash and can be restored.
                    </p>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            className="rounded-lg px-3 py-2 text-sm hover:bg-accent"
                            onClick={() => setDeleteId(null)}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={saving}
                            className="rounded-lg bg-destructive px-4 py-2 text-sm text-white disabled:opacity-40"
                            onClick={deleteNodeFromExplorer}
                        >
                            Delete
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
