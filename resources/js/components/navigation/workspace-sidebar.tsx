// Full-height alternative navigation shell; page rendering and tab state are shared.
import { router } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { ChevronDown, Check, Home, Library, ChartNoAxesColumn, Trash2, Settings2, PanelLeftClose, Search, FolderTree } from 'lucide-react';
import { toast } from 'sonner';
import * as Menu from '@/components/ui/dropdown-menu';
import AppLogoIcon from '@/components/app-logo-icon';
import type { WorkspaceSummary } from '@/components/hierarchy/workspace-panel';
import type { TreeNode } from './navigation-types';
import { CreateNodeForm } from './create-node-form';
import { WorkspaceSidebarTree } from './workspace-sidebar-tree';
import { openLocation } from './tab-navigation';
import { ExplorerCreateMenu } from '@/components/hierarchy/explorer-create-menu';
import { Dialog, DialogContent, DialogTitle } from './navigation-dialog';
import {
    updateWorkspaceNavigationPreferences,
    useWorkspaceNavigationPreferences,
} from './workspace-navigation-preferences';

type Workspace = Pick<WorkspaceSummary, 'id' | 'name'>;

function readIds(key: string): number[] {
    try {
        const value: unknown = JSON.parse(localStorage.getItem(key) ?? 'null');
        return Array.isArray(value)
            ? value.filter((id): id is number => Number.isSafeInteger(id) && id > 0)
            : [];
    } catch {
        return [];
    }
}

export function WorkspaceSidebar({
    workspace,
    workspaces,
    userId,
    activeNodeId,
    currentFolderId,
    currentPath,
    pageNodes,
}: {
    workspace?: Workspace;
    workspaces: WorkspaceSummary[];
    userId: number;
    activeNodeId?: number;
    currentFolderId?: number | null;
    currentPath: string;
    pageNodes?: TreeNode[];
}) {
    const { sidebarOpen, sidebarWidth } = useWorkspaceNavigationPreferences();
    const storagePrefix = `orbium.workspace-tree.${userId}.${workspace?.id ?? 'none'}`;
    const [expandedIds, setExpandedIds] = useState<number[]>(() => readIds(`${storagePrefix}.expanded`));
    const [nodes, setNodes] = useState<TreeNode[]>(pageNodes ?? []);
    const [createType, setCreateType] = useState<TreeNode['type'] | null>(null);
    const resizePreview = useRef<number | null>(null);
    const sidebarElement = useRef<HTMLElement>(null);
    const [moving, setMoving] = useState(false);
    const drag = useRef<{ startX: number; width: number } | null>(null);
    const scrollContainer = useRef<HTMLDivElement>(null);
    const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fetchController = useRef<AbortController | null>(null);

    function refreshTree() {
        if (!workspace) return;
        fetchController.current?.abort();
        const controller = new AbortController();
        fetchController.current = controller;
        fetch(`/workspaces/${workspace.id}/tree`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
        })
            .then((response) => {
                if (!response.ok) throw new Error('Could not load explorer');
                return response.json() as Promise<TreeNode[]>;
            })
            .then((result) => {
                if (!controller.signal.aborted) setNodes(result);
            })
            .catch(() => {
                if (!controller.signal.aborted)
                    toast.error('Could not refresh the workspace explorer.');
            });
    }

    useEffect(() => {
        if (pageNodes) setNodes(pageNodes);
    }, [pageNodes]);

    useEffect(() => {
        if (workspace && !pageNodes) refreshTree();
        return () => fetchController.current?.abort();
    }, [workspace?.id]);

    useEffect(() => {
        const remove = router.on('finish', (event) => {
            if (String(event.detail.visit.method).toLowerCase() !== 'get') {
                refreshTree();
            }
        });
        return () => remove();
    }, [workspace?.id]);

    useEffect(() => {
        if (!workspace || !activeNodeId || nodes.length === 0) return;
        const byId = new Map(nodes.map((node) => [node.id, node]));
        const ancestors: number[] = [];
        const visited = new Set<number>();
        let parentId = byId.get(activeNodeId)?.parent_id;
        while (parentId !== null && parentId !== undefined && !visited.has(parentId)) {
            visited.add(parentId);
            const parent = byId.get(parentId);
            if (!parent || parent.type !== 'folder') break;
            ancestors.push(parentId);
            parentId = parent.parent_id;
        }
        if (ancestors.length === 0) return;
        setExpandedIds((previous) => {
            const next = Array.from(new Set([...previous, ...ancestors]));
            if (next.length === previous.length) return previous;
            try {
                localStorage.setItem(`${storagePrefix}.expanded`, JSON.stringify(next));
            } catch { /* Storage is optional. */ }
            return next;
        });
    }, [workspace?.id, activeNodeId, nodes]);

    useEffect(() => {
        const container = scrollContainer.current;
        if (!container) return;
        try {
            container.scrollTop = Number(localStorage.getItem(`${storagePrefix}.scroll`)) || 0;
        } catch { /* Storage is optional. */ }
    }, [storagePrefix]);

    useEffect(() => () => {
        if (scrollTimer.current) clearTimeout(scrollTimer.current);
    }, []);

    const activeType = useMemo(
        () => nodes.find((node) => node.id === activeNodeId)?.type,
        [nodes, activeNodeId],
    );
    const activeCreateParent = currentFolderId ?? (activeType === 'folder' ? activeNodeId : null);

    function toggleFolder(id: number) {
        setExpandedIds((previous) => {
            const next = previous.includes(id)
                ? previous.filter((value) => value !== id)
                : [...previous, id];
            try {
                localStorage.setItem(`${storagePrefix}.expanded`, JSON.stringify(next));
            } catch { /* Storage is optional. */ }
            return next;
        });
    }

    function handleResizeMove(event: PointerEvent<HTMLDivElement>) {
        if (!drag.current) return;
        const value = Math.max(220, Math.min(440, drag.current.width + event.clientX - drag.current.startX));
        resizePreview.current = value;
        if (sidebarElement.current) sidebarElement.current.style.width = `${value}px`;
    }

    function stopResize() {
        if (resizePreview.current !== null) {
            updateWorkspaceNavigationPreferences({ sidebarWidth: resizePreview.current });
        }
        resizePreview.current = null;
        drag.current = null;
    }

    function moveNode(sourceId: number, destinationId: number | null) {
        if (!workspace || moving) return;
        const movingNode = nodes.find((node) => node.id === sourceId);
        if (!movingNode || movingNode.parent_id === destinationId) return;
        const position = nodes.filter((node) => node.parent_id === destinationId).length;
        setMoving(true);
        router.patch(
            `/workspaces/${workspace.id}/nodes/${sourceId}/move`,
            { parent_id: destinationId, position },
            {
                preserveScroll: true,
                onError: (errors) => toast.error(Object.values(errors)[0] ?? 'Could not move item.'),
                onFinish: () => setMoving(false),
            },
        );
    }

    const width = sidebarOpen ? sidebarWidth : 0;

    return (
        <aside
            ref={sidebarElement}
            className="workspace-sidebar glass-surface"
            data-open={sidebarOpen}
            style={{ width }}
            aria-label="Workspace navigation"
            inert={!sidebarOpen}
        >
            <div className="workspace-sidebar-inner">
                <header className="workspace-sidebar-header">
                    <AppLogoIcon className="workspace-sidebar-logo" />
                    <Menu.Root>
                        <Menu.Trigger className="workspace-sidebar-selector" aria-label="Select workspace">
                            <span>{workspace?.name ?? 'Workspaces'}</span>
                            <ChevronDown size={15} />
                        </Menu.Trigger>
                        <Menu.Content className="floating-menu" align="start" sideOffset={8}>
                            {workspaces.map((item) => (
                                <Menu.Item
                                    key={item.id}
                                    className="floating-menu-item"
                                    onSelect={() => openLocation(`/workspaces/${item.id}`)}
                                >
                                    <span className="truncate">{item.name}</span>
                                    {workspace?.id === item.id && <Check size={15} />}
                                </Menu.Item>
                            ))}
                            <Menu.Separator />
                            <Menu.Item className="floating-menu-item" onSelect={() => openLocation('/settings/workspaces')}>
                                Manage workspaces
                            </Menu.Item>
                        </Menu.Content>
                    </Menu.Root>
                    <button
                        className="workspace-sidebar-icon-button"
                        type="button"
                        aria-label="Hide sidebar"
                        onClick={() => updateWorkspaceNavigationPreferences({ sidebarOpen: false })}
                    >
                        <PanelLeftClose size={18} />
                    </button>
                </header>
                <div className="workspace-sidebar-primary">
                    {workspace && (
                        <button
                            type="button"
                            className="workspace-sidebar-action"
                            data-current={currentPath === `/workspaces/${workspace.id}`}
                            onClick={() => openLocation(`/workspaces/${workspace.id}`)}
                        >
                            <Home size={17} /> Home
                        </button>
                    )}
                    <button
                        type="button"
                        className="workspace-sidebar-action"
                        onClick={() => window.dispatchEvent(new Event('orbium:open-search'))}
                    >
                        <Search size={17} /> Search Master
                    </button>
                </div>
                <div
                    className="workspace-sidebar-explorer-heading"
                    onDragOver={(event) => {
                        if (workspace && event.dataTransfer.types.includes(`application/orbium-workspace-${workspace.id}`))
                            event.preventDefault();
                    }}
                    onDrop={(event) => {
                        if (!workspace || !event.dataTransfer.types.includes(`application/orbium-workspace-${workspace.id}`))
                            return;
                        event.preventDefault();
                        const sourceId = Number(event.dataTransfer.getData('application/orbium-node'));
                        if (Number.isSafeInteger(sourceId)) moveNode(sourceId, null);
                    }}
                >
                    <span><FolderTree size={14} /> Explorer</span>
                    {workspace && (
                        <ExplorerCreateMenu disabled={false} onCreate={setCreateType} />
                    )}
                </div>
                <div
                    ref={scrollContainer}
                    className="workspace-sidebar-scroll"
                    onScroll={(event) => {
                        const top = event.currentTarget.scrollTop;
                        if (scrollTimer.current) clearTimeout(scrollTimer.current);
                        scrollTimer.current = setTimeout(() => {
                            try {
                                localStorage.setItem(`${storagePrefix}.scroll`, String(top));
                            } catch { /* Storage is optional. */ }
                        }, 150);
                    }}
                >
                    {workspace && (
                        <WorkspaceSidebarTree
                            workspaceId={workspace.id}
                            nodes={nodes}
                            activeNodeId={activeNodeId}
                            expandedIds={expandedIds}
                            onToggle={toggleFolder}
                            onMove={moveNode}
                        />
                    )}
                </div>
                <nav className="workspace-sidebar-bottom" aria-label="Workspace tools">
                    {workspace && (
                        <button
                            type="button"
                            className="workspace-sidebar-action"
                            data-current={currentPath.includes('/library')}
                            onClick={() => openLocation(`/workspaces/${workspace.id}/library`)}
                        >
                            <Library size={17} /> Library
                        </button>
                    )}
                    <button
                        type="button"
                        className="workspace-sidebar-action"
                        data-current={currentPath.startsWith('/statistics')}
                        onClick={() => openLocation('/statistics')}
                    >
                        <ChartNoAxesColumn size={17} /> Statistics
                    </button>
                    <button
                        type="button"
                        className="workspace-sidebar-action"
                        data-current={currentPath === '/trash'}
                        onClick={() => openLocation('/trash')}
                    >
                        <Trash2 size={17} /> Trash
                    </button>
                    <button
                        type="button"
                        className="workspace-sidebar-action"
                        data-current={currentPath.startsWith('/settings/')}
                        onClick={() => openLocation('/settings/appearance')}
                    >
                        <Settings2 size={17} /> Settings
                    </button>
                </nav>
                <div
                    className="workspace-sidebar-resize"
                    role="separator"
                    aria-label="Resize sidebar"
                    aria-orientation="vertical"
                    tabIndex={0}
                    aria-valuemin={220}
                    aria-valuemax={440}
                    aria-valuenow={Math.round(sidebarWidth)}
                    onKeyDown={(event) => {
                        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                            event.preventDefault();
                            updateWorkspaceNavigationPreferences({
                                sidebarWidth: Math.max(
                                    220, Math.min(440, sidebarWidth + (event.key === 'ArrowLeft' ? -20 : 20)),
                                ),
                            });
                        }
                    }}
                    onPointerDown={(event) => {
                        if (event.button !== 0) return;
                        drag.current = { startX: event.clientX, width: sidebarWidth };
                        event.currentTarget.setPointerCapture(event.pointerId);
                    }}
                    onPointerMove={handleResizeMove}
                    onPointerUp={stopResize}
                    onPointerCancel={stopResize}
                />
            </div>
            <Dialog open={createType !== null} onOpenChange={(open) => !open && setCreateType(null)}>
                <DialogContent>
                    <DialogTitle>New {createType}</DialogTitle>
                    {workspace && createType && (
                        <CreateNodeForm
                            workspaceId={workspace.id}
                            parentId={activeCreateParent ?? null}
                            type={createType}
                            onCancel={() => setCreateType(null)}
                            onCreated={() => setCreateType(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </aside>
    );
}
