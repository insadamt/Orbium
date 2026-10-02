import { router, usePage } from '@inertiajs/react';
import { ChevronDown, Search } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import AppearanceTabs from '@/components/appearance-tabs';
import { AppBackground } from '@/backgrounds/app-background';
import { useSurfaceStyle } from '@/backgrounds/surface-preferences';
import { FloatingTopControls } from '@/components/hierarchy/floating-top-controls';
import type { TrashedNode } from '@/components/hierarchy/node-browser';
import type { WorkspaceSummary } from '@/components/hierarchy/workspace-panel';
import { NavigationEvents } from '@/components/navigation/navigation-events';
import { NavigationBackButton } from '@/components/navigation/navigation-back-button';
import { NavigationTabStrip } from '@/components/navigation/navigation-tab-strip';
import { PageSearchProvider } from '@/components/navigation/page-search';
import { SplitWorkspace } from '@/components/navigation/split-workspace';
import {
    locationForPage,
    notifyPaneLocation,
    openLocation,
} from '@/components/navigation/tab-navigation';
import { WorkspaceSelector } from '@/components/navigation/workspace-selector';
import type { TreeNode } from '@/components/navigation/navigation-types';
import type { Auth, BreadcrumbItem } from '@/types';

type ShellPageProps = {
    [key: string]: unknown;
    auth: Auth;
    workspace?: { id: number; name: string };
    workspaces?: WorkspaceSummary[];
    nodes?: TreeNode[];
    trashedNodes?: TrashedNode[];
    currentNode?: TreeNode | null;
    node?: { id: number; title: string; icon?: string | null };
    document?: { icon_attachment_id?: number | null };
    database?: {
        id: number;
        title: string;
        icon?: string | null;
        icon_attachment_id?: number | null;
    };
    breadcrumbs?: BreadcrumbItem[];
};

type AppLayoutProps = {
    breadcrumbs?: BreadcrumbItem[];
    children: ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
    const page = usePage<ShellPageProps>();
    const { auth } = page.props;
    const isPane = window.self !== window.top;
    useEffect(() => {
        if (!isPane) return;
        notifyPaneLocation(locationForPage(page));
    }, [isPane, page.url, page.props]);
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
    const currentPath = page.url.split('?')[0];
    const floatingBreadcrumbs: BreadcrumbItem[] = page.component.startsWith(
        'settings/',
    )
        ? [
              ...(shellWorkspace
                  ? [
                        {
                            title: shellWorkspace.name,
                            href: `/workspaces/${shellWorkspace.id}`,
                        },
                    ]
                  : []),
              { title: 'Settings', href: '/settings/profile' },
              {
                  title: page.component
                      .split('/')[1]
                      .replace(/^./, (letter) => letter.toUpperCase()),
                  href: currentPath,
              },
          ]
        : page.component === 'documents/show' && page.props.node
          ? [
                ...breadcrumbLinks,
                { title: page.props.node.title, href: currentPath },
            ]
          : breadcrumbLinks;
    const [accountMenuOpen, setAccountMenuOpen] = useState(false);
    const surfaceStyle = useSurfaceStyle();

    function signOut(): void {
        router.post('/logout');
    }

    return (
        <div
            className={`orbium-shell surface-${surfaceStyle} ${isPane ? 'orbium-embedded-pane' : ''} min-h-screen bg-background text-foreground`}
        >
            {!isPane && <AppBackground />}
            {!isPane && <NavigationEvents />}
            {!isPane && !isFloatingPage && (
                <header className="glass-surface sticky top-0 z-20 border-b border-border/70">
                    <div className="flex h-14 items-center gap-2 px-3 md:gap-3 md:px-5">
                        <NavigationBackButton className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-40" />
                        <WorkspaceSelector />
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
                                    <button
                                        type="button"
                                        onClick={() =>
                                            openLocation('/settings/profile')
                                        }
                                        className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
                                    >
                                        Profile settings
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            openLocation('/settings/security')
                                        }
                                        className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
                                    >
                                        Password
                                    </button>
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
            <PageSearchProvider routePath={page.url.split('?')[0]}>
                <main
                    className={`orbium-main w-full ${isFloatingPage ? 'floating-workspace' : 'mx-auto max-w-[1600px] px-5 py-10 md:px-8 md:py-14'}`}
                >
                    {!isPane && isFloatingPage && (
                        <FloatingTopControls
                            key={shellWorkspace?.id ?? 'home'}
                            workspace={shellWorkspace}
                            workspaces={page.props.workspaces ?? []}
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
                            breadcrumbs={floatingBreadcrumbs}
                            showContentActions={isHomePage}
                            pageType={pageType}
                        />
                    )}
                    {isPane ? (
                        children
                    ) : (
                        <SplitWorkspace>{children}</SplitWorkspace>
                    )}
                </main>
            </PageSearchProvider>
        </div>
    );
}
