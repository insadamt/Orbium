import { Link, router, usePage } from '@inertiajs/react';
import { ChevronDown, Settings2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import AppearanceTabs from '@/components/appearance-tabs';
import type { Auth, BreadcrumbItem } from '@/types';

type ShellPageProps = {
    auth: Auth;
};

type AppLayoutProps = {
    breadcrumbs?: BreadcrumbItem[];
    children: ReactNode;
};

export default function AppLayout({
    breadcrumbs = [],
    children,
}: AppLayoutProps) {
    const { auth } = usePage<ShellPageProps>().props;
    const [accountMenuOpen, setAccountMenuOpen] = useState(false);

    function signOut(): void {
        router.post('/logout');
    }

    return (
        <div className="orbium-shell min-h-screen bg-background text-foreground">
            <header className="glass-surface sticky top-0 z-20 border-b border-border/70">
                <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-5 px-5 md:px-8">
                    <Link
                        href="/dashboard"
                        className="flex shrink-0 items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                    >
                        <span aria-hidden="true" className="orbium-mark" />
                        <span className="text-sm font-semibold tracking-[0.18em] uppercase">
                            Orbium
                        </span>
                    </Link>
                    <span
                        className="hidden h-5 w-px bg-border md:block"
                        aria-hidden="true"
                    />
                    <nav
                        aria-label="Breadcrumb"
                        className="min-w-0 flex-1 text-sm text-muted-foreground"
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
                            {breadcrumbs.map((crumb) => (
                                <li
                                    key={crumb.title}
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
                    <div className="relative shrink-0">
                        <button
                            type="button"
                            aria-expanded={accountMenuOpen}
                            aria-controls="account-menu"
                            onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                            className="flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-2 text-xs font-medium hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                            <span className="max-w-28 truncate">
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
                <div className="mx-auto flex h-11 max-w-[1600px] items-center justify-between gap-4 border-t border-border/50 px-5 md:px-8">
                    <div
                        role="tablist"
                        aria-label="Open tabs"
                        className="flex items-center gap-2"
                    >
                        <span
                            role="tab"
                            aria-selected="true"
                            className="rounded-t-md border-b-2 border-foreground px-3 py-2 text-xs font-medium"
                        >
                            Home
                        </span>
                        <span className="text-xs text-muted-foreground">
                            Workspace tabs arrive in Phase 4
                        </span>
                    </div>
                    <Link
                        href="/settings/appearance"
                        aria-label="Appearance settings"
                        className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                    >
                        <Settings2 size={16} />
                    </Link>
                </div>
            </header>
            <main className="mx-auto max-w-[1600px] px-5 py-10 md:px-8 md:py-14">
                {children}
            </main>
            <footer className="mx-auto flex max-w-[1600px] items-center justify-between border-t border-border px-5 py-5 text-xs text-muted-foreground md:px-8">
                <span>Orbium · Foundation</span>
                <AppearanceTabs />
            </footer>
        </div>
    );
}
