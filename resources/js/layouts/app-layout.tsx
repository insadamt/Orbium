import { Link, router, usePage } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import AppearanceTabs from '@/components/appearance-tabs';
import { WorkspaceNavigation } from '@/components/navigation/workspace-navigation';
import type { Auth, BreadcrumbItem } from '@/types';

type ShellPageProps = {
    auth: Auth;
    breadcrumbs?: BreadcrumbItem[];
};

type AppLayoutProps = {
    breadcrumbs?: BreadcrumbItem[];
    children: ReactNode;
};

export default function AppLayout({
    breadcrumbs = [],
    children,
}: AppLayoutProps) {
    const { auth, breadcrumbs: pageBreadcrumbs } =
        usePage<ShellPageProps>().props;
    const activeBreadcrumbs = pageBreadcrumbs ?? breadcrumbs;
    const [accountMenuOpen, setAccountMenuOpen] = useState(false);

    function signOut(): void {
        router.post('/logout');
    }

    return (
        <div className="orbium-shell min-h-screen bg-background text-foreground">
            <header className="glass-surface sticky top-0 z-20 border-b border-border/70">
                <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-4 md:gap-5 md:px-8">
                    <Link
                        href="/dashboard"
                        className="flex shrink-0 items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                    >
                        <span aria-hidden="true" className="orbium-mark" />
                        <span className="hidden text-sm font-semibold tracking-[0.18em] uppercase sm:inline">
                            Orbium
                        </span>
                    </Link>
                    <span
                        className="hidden h-5 w-px bg-border md:block"
                        aria-hidden="true"
                    />
                    <nav
                        aria-label="Breadcrumb"
                        className="min-w-0 flex-1 overflow-hidden text-sm text-muted-foreground"
                    >
                        <ol className="flex min-w-0 items-center gap-2">
                            <li>
                                <Link
                                    href="/dashboard"
                                    className="hover:text-foreground"
                                >
                                    Home
                                </Link>
                            </li>
                            {activeBreadcrumbs.map((crumb) => (
                                <li
                                    key={JSON.stringify(crumb.href)}
                                    className="flex min-w-0 items-center gap-2"
                                >
                                    <span aria-hidden="true">/</span>
                                    <Link
                                        href={crumb.href}
                                        className="truncate hover:text-foreground"
                                    >
                                        {crumb.title}
                                    </Link>
                                </li>
                            ))}
                        </ol>
                    </nav>
                    <WorkspaceNavigation />
                    <div className="relative shrink-0">
                        <button
                            type="button"
                            aria-label="Account menu"
                            aria-expanded={accountMenuOpen}
                            aria-controls="account-menu"
                            onClick={() => setAccountMenuOpen(!accountMenuOpen)}
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
                                className="glass-surface absolute right-0 mt-2 w-56 rounded-xl border border-border p-2 shadow-xl"
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
            <main className="orbium-main mx-auto max-w-[1600px] px-5 py-10 md:px-8 md:py-14">
                {children}
            </main>
            <footer className="mx-auto flex max-w-[1600px] items-center justify-between border-t border-border px-5 py-5 text-xs text-muted-foreground md:px-8">
                <span>Orbium · Workspaces</span>
                <AppearanceTabs />
            </footer>
        </div>
    );
}
