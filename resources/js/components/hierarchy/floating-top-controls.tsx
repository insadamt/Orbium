import { Link, router, usePage } from '@inertiajs/react';
import * as Menu from '@radix-ui/react-dropdown-menu';
import { Check, ChevronDown, Plus, Settings2 } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import AppLogoIcon from '@/components/app-logo-icon';
import AppearanceTabs from '@/components/appearance-tabs';
import { CreateNodeForm } from '@/components/navigation/create-node-form';
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/navigation/navigation-dialog';
import { NavigationTabStrip } from '@/components/navigation/navigation-tab-strip';
import { NavigationBackButton } from '@/components/navigation/navigation-back-button';
import { FloatingPageSearch } from '@/components/navigation/floating-navigation-buttons';
import { FloatingBreadcrumbs } from '@/components/navigation/floating-breadcrumbs';
import { usePageSearch } from '@/components/navigation/page-search';
import type { TreeNode } from '@/components/navigation/navigation-types';
import { openLocation } from '@/components/navigation/tab-navigation';
import type { Auth, BreadcrumbItem } from '@/types';
import type { WorkspaceSummary } from './workspace-panel';
import OrbitalTrash from './orbital-trash';
import type { TrashedNode } from './node-browser';

type Props = {
    workspace?: Pick<WorkspaceSummary, 'id' | 'name'>;
    workspaces: WorkspaceSummary[];
    currentNode: TreeNode | null;
    trashedNodes: TrashedNode[];
    nodes: TreeNode[];
    breadcrumbs: BreadcrumbItem[];
    showContentActions?: boolean;
    pageType: 'explorer' | 'document' | 'database' | 'settings';
};

export function FloatingTopControls({
    workspace,
    workspaces,
    currentNode,
    trashedNodes,
    nodes,
    breadcrumbs,
    showContentActions = true,
    pageType,
}: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const pageSearch = usePageSearch();
    const [trashOpen, setTrashOpen] = useState(false);
    const [createType, setCreateType] = useState<TreeNode['type'] | null>(null);
    const [newWorkspaceOpen, setNewWorkspaceOpen] = useState(false);
    const [workspaceName, setWorkspaceName] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [rootDropActive, setRootDropActive] = useState(false);
    const topControlsRef = useRef<HTMLElement>(null);
    const [topControlsHeight, setTopControlsHeight] = useState(0);

    useLayoutEffect(() => {
        const topControls = topControlsRef.current;
        if (!topControls) return;

        const updateTopControlsHeight = () => {
            setTopControlsHeight(
                Math.ceil(topControls.getBoundingClientRect().height),
            );
        };
        const resizeObserver = new ResizeObserver(updateTopControlsHeight);
        resizeObserver.observe(topControls);
        updateTopControlsHeight();

        return () => resizeObserver.disconnect();
    }, []);

    useEffect(() => {
        if (!workspace || pageType === 'settings') return;
        try {
            localStorage.setItem(
                'orbium.lastWorkspaceId',
                String(workspace.id),
            );
        } catch {
            // Browser storage availability does not affect navigation.
        }
    }, [workspace, pageType]);

    useEffect(() => {
        setTrashOpen(false);
        setCreateType(null);
        setNewWorkspaceOpen(false);
        setWorkspaceName('');
        setError('');
        setRootDropActive(false);
    }, [workspace?.id]);
    return (
        <>
            <header ref={topControlsRef} className="floating-top-controls">
                <div className="floating-workspace-controls">
                    <NavigationBackButton className="floating-icon-button floating-surface" />
                    <Link
                        href={
                            workspace
                                ? `/workspaces/${workspace.id}`
                                : '/dashboard'
                        }
                        className={`floating-logo floating-surface ${rootDropActive ? 'ring-2 ring-ring' : ''}`}
                        aria-label="Workspace home"
                        onDragOver={(event) => {
                            if (
                                !workspace ||
                                !currentNode ||
                                !event.dataTransfer.types.includes(
                                    `application/orbium-workspace-${workspace.id}`,
                                )
                            )
                                return;
                            event.preventDefault();
                            event.dataTransfer.dropEffect = 'move';
                            setRootDropActive(true);
                        }}
                        onDragLeave={() => setRootDropActive(false)}
                        onDrop={(event) => {
                            event.preventDefault();
                            setRootDropActive(false);
                            if (
                                !workspace ||
                                !event.dataTransfer.types.includes(
                                    `application/orbium-workspace-${workspace.id}`,
                                )
                            )
                                return;
                            const nodeId = Number(
                                event.dataTransfer.getData(
                                    'application/orbium-node',
                                ),
                            );
                            const source = nodes.find(
                                (node) => node.id === nodeId,
                            );
                            if (!source || source.parent_id === null) return;
                            router.patch(
                                `/workspaces/${workspace.id}/nodes/${nodeId}/move`,
                                {
                                    parent_id: null,
                                    position: nodes.filter(
                                        (node) => node.parent_id === null,
                                    ).length,
                                },
                                {
                                    preserveScroll: true,
                                    onError: (errors) =>
                                        toast.error(Object.values(errors)[0]),
                                },
                            );
                        }}
                    >
                        <AppLogoIcon className="size-7" />
                    </Link>
                    <Menu.Root>
                        <Menu.Trigger
                            className="floating-workspace-trigger floating-surface"
                            aria-label="Select workspace"
                        >
                            <span>{workspace?.name ?? 'Workspaces'}</span>
                            <ChevronDown size={14} />
                        </Menu.Trigger>
                        <Menu.Portal>
                            <Menu.Content
                                className="floating-menu"
                                align="start"
                                sideOffset={12}
                            >
                                {workspaces.map((item) => (
                                    <Menu.Item
                                        key={item.id}
                                        className="floating-menu-item"
                                        onSelect={() =>
                                            openLocation(
                                                `/workspaces/${item.id}`,
                                            )
                                        }
                                    >
                                        <span className="truncate">
                                            {item.name}
                                        </span>
                                        {item.id === workspace?.id && (
                                            <Check
                                                size={15}
                                                aria-label="Current workspace"
                                            />
                                        )}
                                    </Menu.Item>
                                ))}
                                <Menu.Separator className="my-2 border-t border-border/60" />
                                <Menu.Item
                                    className="floating-menu-item"
                                    onSelect={() => setNewWorkspaceOpen(true)}
                                >
                                    <Plus size={15} /> New workspace
                                </Menu.Item>
                                <Menu.Item
                                    className="floating-menu-item"
                                    onSelect={() =>
                                        openLocation('/settings/workspaces')
                                    }
                                >
                                    <Settings2 size={15} /> Manage workspaces
                                </Menu.Item>
                            </Menu.Content>
                        </Menu.Portal>
                    </Menu.Root>
                    <FloatingBreadcrumbs items={breadcrumbs} />
                </div>
                <div className="floating-tab-island floating-surface">
                    <NavigationTabStrip floating />
                    <button
                        type="button"
                        className="floating-add-tab"
                        aria-label="Open workspace home in a new tab"
                        onClick={() =>
                            openLocation(
                                workspace
                                    ? `/workspaces/${workspace.id}`
                                    : '/dashboard',
                                true,
                            )
                        }
                    >
                        <Plus size={18} />
                    </button>
                </div>
                <div
                    className="floating-account-controls"
                    data-search-open={pageSearch.open}
                >
                    <FloatingPageSearch pageType={pageType} />
                    <button
                        type="button"
                        onClick={() => openLocation('/settings/profile')}
                        className="floating-icon-button floating-surface"
                        aria-label="Settings"
                    >
                        <Settings2 size={18} />
                    </button>
                    <Menu.Root>
                        <Menu.Trigger
                            className="floating-user-trigger floating-surface"
                            aria-label="Account menu"
                        >
                            <span>{auth.user.name}</span>
                            <ChevronDown size={14} />
                        </Menu.Trigger>
                        <Menu.Portal>
                            <Menu.Content
                                className="floating-menu"
                                align="end"
                                sideOffset={12}
                            >
                                <Menu.Item
                                    className="floating-menu-item"
                                    onSelect={() =>
                                        openLocation('/settings/workspaces')
                                    }
                                >
                                    Manage workspaces
                                </Menu.Item>
                                {workspace && showContentActions && (
                                    <>
                                        <Menu.Separator className="my-2 border-t border-border/60" />
                                        {(
                                            [
                                                'document',
                                                'folder',
                                                'database',
                                            ] as const
                                        ).map((type) => (
                                            <Menu.Item
                                                key={type}
                                                className="floating-menu-item"
                                                onSelect={() =>
                                                    setCreateType(type)
                                                }
                                            >
                                                New {type}
                                            </Menu.Item>
                                        ))}
                                    </>
                                )}
                                {workspace && showContentActions && (
                                    <Menu.Item
                                        className="floating-menu-item"
                                        onSelect={() => setTrashOpen(true)}
                                    >
                                        Trash
                                    </Menu.Item>
                                )}
                                <div className="px-2 py-3">
                                    <AppearanceTabs className="w-full justify-center" />
                                </div>
                                <Menu.Item
                                    className="floating-menu-item"
                                    onSelect={() => router.post('/logout')}
                                >
                                    Sign out
                                </Menu.Item>
                            </Menu.Content>
                        </Menu.Portal>
                    </Menu.Root>
                </div>
            </header>
            <div aria-hidden="true" style={{ height: topControlsHeight }} />
            <Dialog open={newWorkspaceOpen} onOpenChange={setNewWorkspaceOpen}>
                <DialogContent>
                    <DialogTitle>New workspace</DialogTitle>
                    <form
                        className="space-y-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            if (!workspaceName.trim() || saving) return;
                            setSaving(true);
                            setError('');
                            router.post(
                                '/workspaces',
                                { name: workspaceName.trim() },
                                {
                                    onSuccess: () => {
                                        setNewWorkspaceOpen(false);
                                        setWorkspaceName('');
                                    },
                                    onError: (errors) =>
                                        setError(Object.values(errors)[0]),
                                    onFinish: () => setSaving(false),
                                },
                            );
                        }}
                    >
                        <input
                            autoFocus
                            aria-label="Workspace name"
                            maxLength={255}
                            value={workspaceName}
                            onChange={(event) =>
                                setWorkspaceName(event.target.value)
                            }
                            className="w-full rounded-lg border border-border bg-background p-3"
                        />
                        {error && (
                            <p
                                role="alert"
                                className="text-sm text-destructive"
                            >
                                {error}
                            </p>
                        )}
                        <button
                            disabled={saving || !workspaceName.trim()}
                            className="rounded-lg bg-foreground px-4 py-2 text-background disabled:opacity-40"
                        >
                            {saving ? 'Creating…' : 'Create workspace'}
                        </button>
                    </form>
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
                    {workspace && createType && (
                        <CreateNodeForm
                            workspaceId={workspace.id}
                            parentId={currentNode?.id ?? null}
                            type={createType}
                            onCancel={() => setCreateType(null)}
                            onCreated={() => setCreateType(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
            {trashOpen && workspace && (
                <OrbitalTrash
                    workspaceId={workspace.id}
                    nodes={trashedNodes}
                    onClose={() => setTrashOpen(false)}
                />
            )}
        </>
    );
}
