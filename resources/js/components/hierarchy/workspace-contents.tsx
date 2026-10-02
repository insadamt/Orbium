import { router } from '@inertiajs/react';
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { Images, LayoutGrid, List, SlidersHorizontal } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/navigation/navigation-dialog';
import { CreateNodeForm } from '@/components/navigation/create-node-form';
import {
    nodeUrl,
    type TreeNode,
} from '@/components/navigation/navigation-types';
import { openLocation } from '@/components/navigation/tab-navigation';
import { usePageSearch } from '@/components/navigation/page-search';
import { useContainerView } from '@/components/navigation/use-container-view';
import { FloatingItem } from './floating-item';
import {
    ExplorerContextMenu,
    type ExplorerMenuPosition,
} from './explorer-context-menu';
import { useItemDrag } from './use-item-drag';
import {
    galleryAppearance,
    ratioNumber,
    type GalleryAppearance,
} from './cover-presentation';
import { GalleryAppearanceEditor } from './gallery-appearance-editor';
import { MasonryLayout } from './masonry-layout';
import { csrfToken } from '@/components/editor/editor-api';

export function WorkspaceContents({
    workspaceId,
    nodes,
    parentId,
    initialGalleryConfig,
}: {
    workspaceId: number;
    nodes: TreeNode[];
    parentId: number | null;
    initialGalleryConfig?:
        | (GalleryAppearance & { legacy_preview?: boolean })
        | null;
}) {
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
    const [savedView, setView] = useContainerView<'grid' | 'list' | 'gallery'>(
        `explorer.${workspaceId}.${parentId ?? 'root'}.view`,
        'grid',
    );
    const view = ['grid', 'list', 'gallery'].includes(savedView)
        ? savedView
        : 'grid';
    const focusId = Number(
        new URLSearchParams(window.location.search).get('focus'),
    );
    const [selectedId, setSelectedId] = useState<number | null>(
        focusId || null,
    );
    const [menuPosition, setMenuPosition] =
        useState<ExplorerMenuPosition | null>(null);
    const [createType, setCreateType] = useState<TreeNode['type'] | null>(null);
    const [renameId, setRenameId] = useState<number | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [newTitle, setNewTitle] = useState('');
    const [saving, setSaving] = useState(false);
    const [moving, setMoving] = useState(false);
    const [parentDropActive, setParentDropActive] = useState(false);
    const [announcement, setAnnouncement] = useState('');
    const search = usePageSearch();
    const normalizedQuery = search.query.trim().toLocaleLowerCase();
    const children = nodes
        .filter(
            (node) =>
                node.parent_id === parentId &&
                (!normalizedQuery ||
                    node.title.toLocaleLowerCase().includes(normalizedQuery)),
        )
        .sort((a, b) => a.position - b.position || a.id - b.id);
    useEffect(() => {
        search.setResultCount(normalizedQuery ? children.length : null);
    }, [children.length, normalizedQuery, search.setResultCount]);
    const menuNode = children.find((node) => node.id === menuPosition?.nodeId);
    const deleteNode = nodes.find((node) => node.id === deleteId);
    function move(
        nodeId: number,
        destination: number | null,
        position: number,
    ) {
        if (moving) return;
        setMoving(true);
        router.patch(
            `/workspaces/${workspaceId}/nodes/${nodeId}/move`,
            { parent_id: destination, position },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setAnnouncement('Item moved.');
                },
                onError: (errors) => toast.error(Object.values(errors)[0]),
                onFinish: () => setMoving(false),
            },
        );
    }
    const { draggedId, dropHint, dragHandlers, dropIntoParent } = useItemDrag(
        nodes,
        workspaceId,
        move,
        moving,
    );
    const currentFolder = nodes.find((node) => node.id === parentId);
    const parentDestination = currentFolder?.parent_id ?? null;
    const parentName =
        parentDestination === null
            ? 'workspace root'
            : (nodes.find((node) => node.id === parentDestination)?.title ??
              'parent folder');
    function openNode(node: TreeNode, newTab: boolean) {
        openLocation(nodeUrl(workspaceId, node), newTab);
    }
    function openActionsAt(nodeId: number | null, target: HTMLElement) {
        const bounds = target.getBoundingClientRect();
        setMenuPosition({ nodeId, x: bounds.right, y: bounds.bottom });
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
        router.delete(`/workspaces/${workspaceId}/nodes/${deleteId}`, {
            onSuccess: () => setDeleteId(null),
            onError: (errors) => toast.error(Object.values(errors)[0]),
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
    function renderChild(node: TreeNode, index: number) {
        return (
            <FloatingItem
                key={node.id}
                workspaceId={workspaceId}
                view={view}
                appearance={appearance}
                legacyPreview={legacyPreview}
                node={node}
                selected={selectedId === node.id}
                dragging={draggedId === node.id}
                placement={
                    dropHint?.targetId === node.id
                        ? dropHint.placement
                        : undefined
                }
                dragHandlers={dragHandlers(node)}
                onSelect={() => setSelectedId(node.id)}
                onOpen={(newTab) => openNode(node, newTab)}
                onActions={(target) => openActionsAt(node.id, target)}
                onReorder={(direction) => {
                    const position = index + direction;
                    if (position >= 0 && position < children.length)
                        move(node.id, parentId, position);
                }}
            />
        );
    }
    return (
        <>
            <div className="explorer-view-controls">
                <ToggleGroup.Root
                    type="single"
                    value={view}
                    onValueChange={(next) => {
                        if (next) setView(next as typeof view);
                    }}
                    aria-label="Explorer view"
                    className="explorer-view-switcher"
                >
                    <ToggleGroup.Item
                        value="grid"
                        aria-label="Grid view"
                        title="Grid view"
                    >
                        <LayoutGrid size={17} />
                    </ToggleGroup.Item>
                    <ToggleGroup.Item
                        value="list"
                        aria-label="List view"
                        title="List view"
                    >
                        <List size={18} />
                    </ToggleGroup.Item>
                    <ToggleGroup.Item
                        value="gallery"
                        aria-label="Gallery view"
                        title="Gallery view"
                    >
                        <Images size={17} />
                    </ToggleGroup.Item>
                </ToggleGroup.Root>
                {view === 'gallery' && (
                    <button
                        type="button"
                        className="explorer-gallery-settings"
                        onClick={() => setAppearanceDraft(appearance)}
                        aria-label="Gallery appearance"
                        title="Gallery appearance"
                    >
                        <SlidersHorizontal size={17} />
                    </button>
                )}
            </div>
            <section
                className="floating-contents"
                data-view={view}
                data-layout={view === 'gallery' ? appearance.layout : undefined}
                aria-label="Current container contents"
                aria-busy={moving}
                tabIndex={0}
                onDragEndCapture={() => setParentDropActive(false)}
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
                    });
                }}
                onKeyDown={(event) => {
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
                {draggedId !== null && currentFolder?.type === 'folder' && (
                    <div
                        className="floating-parent-drop-zone"
                        data-active={parentDropActive}
                        onDragOver={(event) => {
                            event.preventDefault();
                            event.dataTransfer.dropEffect = 'move';
                            setParentDropActive(true);
                        }}
                        onDragLeave={(event) => {
                            if (
                                !(event.relatedTarget instanceof Node) ||
                                !event.currentTarget.contains(
                                    event.relatedTarget,
                                )
                            )
                                setParentDropActive(false);
                        }}
                        onDrop={(event) => {
                            setParentDropActive(false);
                            dropIntoParent(
                                event,
                                currentFolder.id,
                                parentDestination,
                            );
                        }}
                    >
                        Move to {parentName}
                    </div>
                )}
                {view === 'gallery' && appearance.layout === 'natural' ? (
                    <MasonryLayout
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
                        render={(node) =>
                            renderChild(
                                node,
                                children.findIndex(
                                    (child) => child.id === node.id,
                                ),
                            )
                        }
                        minimumWidth={252}
                    />
                ) : (
                    children.map(renderChild)
                )}
            </section>
            {normalizedQuery && children.length === 0 && (
                <p className="floating-no-results" role="status">
                    No items match this search.
                </p>
            )}
            <p className="sr-only" role="status">
                {announcement}
            </p>
            <ExplorerContextMenu
                position={menuPosition}
                nodeTitle={menuNode?.title}
                onClose={() => setMenuPosition(null)}
                onCreate={setCreateType}
                onOpen={(newTab) => menuNode && openNode(menuNode, newTab)}
                onRename={() => {
                    if (!menuNode) return;
                    setNewTitle(menuNode.title);
                    setRenameId(menuNode.id);
                }}
                onDelete={() => menuNode && setDeleteId(menuNode.id)}
            />
            <Dialog
                open={appearanceDraft !== null}
                onOpenChange={(open) => {
                    if (!open && !savingAppearance) setAppearanceDraft(null);
                }}
            >
                <DialogContent>
                    <DialogTitle>Gallery appearance</DialogTitle>
                    {appearanceDraft && (
                        <GalleryAppearanceEditor
                            value={appearanceDraft}
                            onChange={setAppearanceDraft}
                        />
                    )}
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setAppearanceDraft(null)}
                            disabled={savingAppearance}
                            className="rounded-lg px-4 py-2 text-sm hover:bg-muted"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => void saveAppearance()}
                            disabled={savingAppearance}
                            className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
                        >
                            {savingAppearance ? 'Saving…' : 'Apply'}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
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
