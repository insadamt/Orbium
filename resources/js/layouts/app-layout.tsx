import { Link, router, usePage } from '@inertiajs/react';
import { ChevronDown, Search } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import AppearanceTabs from '@/components/appearance-tabs';
import { FloatingTopControls } from '@/components/hierarchy/floating-top-controls';
import type { TrashedNode } from '@/components/hierarchy/node-browser';
import WorkspacePanel, {
    type TrashedWorkspace,
    type WorkspaceSummary,
} from '@/components/hierarchy/workspace-panel';
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/navigation/navigation-dialog';
import { NavigationEvents } from '@/components/navigation/navigation-events';
import { NavigationTabStrip } from '@/components/navigation/navigation-tab-strip';
import { PageSearchProvider } from '@/components/navigation/page-search';
import { WorkspaceSelector } from '@/components/navigation/workspace-selector';
import type { TreeNode } from '@/components/navigation/navigation-types';
import type { Auth, BreadcrumbItem } from '@/types';

type ShellPageProps = {
    auth: Auth;
    workspace?: { id: number; name: string };
    workspaces?: WorkspaceSummary[];
    trashedWorkspaces?: TrashedWorkspace[];
    nodes?: TreeNode[];
    trashedNodes?: TrashedNode[];
    currentNode?: TreeNode | null;
    breadcrumbs?: BreadcrumbItem[];
};

type AppLayoutProps = {
    breadcrumbs?: BreadcrumbItem[];
    children: ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
    const page = usePage<ShellPageProps>();
    const { auth } = page.props;
    const isHomePage = page.component === 'dashboard';
    const isFloatingPage =
        isHomePage ||
        page.component === 'documents/show' ||
        page.component === 'databases/show' ||
        page.component.startsWith('settings/');
    const [settingsWorkspaceId, setSettingsWorkspaceId] = useState<
        number | null
    >(null);
    useEffect(() => {
        try {
            setSettingsWorkspaceId(
                Number(localStorage.getItem('orbium.lastWorkspaceId')) || null,
            );
        } catch {
            setSettingsWorkspaceId(null);
        }
    }, [page.component]);
    const shellWorkspace =
        page.props.workspace ??
        page.props.workspaces?.find(
            (workspace) => workspace.id === settingsWorkspaceId,
        ) ??
        page.props.workspaces?.[0];
    const pageType = isHomePage
        ? 'explorer'
        : page.component === 'documents/show'
          ? 'document'
          : page.component === 'databases/show'
            ? 'database'
            : 'settings';
    const breadcrumbLinks = page.props.breadcrumbs ?? [];
    const fallbackHref = isHomePage
        ? page.props.currentNode
            ? breadcrumbLinks.at(-2)?.href
            : undefined
        : page.component === 'documents/show'
          ? breadcrumbLinks.at(-1)?.href
          : page.component === 'databases/show'
            ? breadcrumbLinks.at(-2)?.href
            : shellWorkspace
              ? `/workspaces/${shellWorkspace.id}`
              : undefined;
    const fallbackUrl =
        typeof fallbackHref === 'string' ? fallbackHref : undefined;
    const [accountMenuOpen, setAccountMenuOpen] = useState(false);
    const [workspaceManagerOpen, setWorkspaceManagerOpen] = useState(false);

    function signOut(): void {
        router.post('/logout');
    }

    return (
        <div className="orbium-shell min-h-screen bg-background text-foreground">
            <NavigationEvents />
            {!isFloatingPage && (
                <header className="glass-surface sticky top-0 z-20 border-b border-border/70">
                    <div className="flex h-14 items-center gap-2 px-3 md:gap-3 md:px-5">
                        <WorkspaceSelector
                            onManage={() => setWorkspaceManagerOpen(true)}
                        />
                        <NavigationTabStrip />
                        <button
                            type="button"
                            aria-label="Search workspace"
                            title="Search workspace (Ctrl + Space)"
                            onClick={() =>
                                window.dispatchEvent(
                                    new Event('orbium:open-search'),
                                )
                            }
                            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                        >
                            <Search size={18} />
                        </button>
                        <div className="relative shrink-0">
                            <button
                                type="button"
                                aria-label="Account menu"
                                aria-expanded={accountMenuOpen}
                                aria-controls="account-menu"
                                onClick={() =>
                                    setAccountMenuOpen(!accountMenuOpen)
                                }
                                className="flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-2 text-xs font-medium hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                            >
                                <span className="hidden max-w-28 truncate sm:inline">
                                    {auth.user.name}
                                </span>
                                <ChevronDown size={14} aria-hidden="true" />
                            </button>
                            {accountMenuOpen && (
                                <div
                                    id="account-menu"
                                    className="glass-surface absolute right-0 mt-2 w-64 rounded-xl border border-border p-2 shadow-xl"
                                >
                                    <p className="truncate px-3 py-2 text-xs text-muted-foreground">
                                        {auth.user.email}
                                    </p>
                                    <Link
                                        href="/settings/profile"
                                        className="block rounded-md px-3 py-2 text-sm hover:bg-accent"
                                    >
                                        Profile settings
                                    </Link>
                                    <Link
                                        href="/settings/security"
                                        className="block rounded-md px-3 py-2 text-sm hover:bg-accent"
                                    >
                                        Password
                                    </Link>
                                    <div className="border-t border-border px-2 py-3">
                                        <p className="mb-2 px-1 text-xs text-muted-foreground">
                                            Appearance
                                        </p>
                                        <AppearanceTabs className="w-full justify-center" />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={signOut}
                                        className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
                                    >
                                        Sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>
            )}
            <PageSearchProvider key={page.url.split('?')[0]}>
                <main
                    className={`orbium-main w-full ${isFloatingPage ? 'floating-workspace' : 'mx-auto max-w-[1600px] px-5 py-10 md:px-8 md:py-14'}`}
                >
                    {isFloatingPage && (
                        <FloatingTopControls
                            key={shellWorkspace?.id ?? 'home'}
                            workspace={shellWorkspace}
                            workspaces={page.props.workspaces ?? []}
                            trashedWorkspaces={
                                page.props.trashedWorkspaces ?? []
                            }
                            currentNode={
                                isHomePage
                                    ? (page.props.currentNode ?? null)
                                    : null
                            }
                            nodes={isHomePage ? (page.props.nodes ?? []) : []}
                            trashedNodes={
                                isHomePage
                                    ? (page.props.trashedNodes ?? [])
                                    : []
                            }
                            fallbackUrl={fallbackUrl}
                            showContentActions={isHomePage}
                            pageType={pageType}
                        />
                    )}
                    {children}
                </main>
            </PageSearchProvider>
            <Dialog
                open={workspaceManagerOpen}
                onOpenChange={setWorkspaceManagerOpen}
            >
                <DialogContent className="max-h-[85dvh] overflow-y-auto">
                    <DialogTitle className="text-lg font-semibold">
                        Manage workspaces
                    </DialogTitle>
                    <WorkspacePanel
                        inline
                        workspaces={page.props.workspaces ?? []}
                        trashedWorkspaces={page.props.trashedWorkspaces ?? []}
                        activeWorkspaceId={page.props.workspace?.id}
                        onWorkspaceNavigation={() =>
                            setWorkspaceManagerOpen(false)
                        }
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
