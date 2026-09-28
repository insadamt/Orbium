import { Head, Link } from '@inertiajs/react';

export default function Dashboard() {
    return (
        <>
            <Head title="Home" />
            <section className="mx-auto flex min-h-[60vh] max-w-3xl flex-col justify-center">
                <div className="mb-8 flex items-center gap-3 text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
                    <span className="h-px w-8 bg-foreground/40" />
                    Your space begins here
                </div>
                <h1 className="max-w-2xl text-5xl leading-tight font-light tracking-tight md:text-7xl">
                    A clearer place for your ideas.
                </h1>
                <p className="mt-7 max-w-lg text-base leading-7 text-muted-foreground">
                    Your account is ready. Workspaces and the knowledge
                    hierarchy arrive in the next phase.
                </p>
                <div className="mt-12 flex flex-wrap items-center gap-4">
                    <Link
                        href="/settings/appearance"
                        className="rounded-full border border-foreground bg-foreground px-5 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                        Set your appearance
                    </Link>
                    <Link
                        href="/settings/profile"
                        className="rounded-full border border-border px-5 py-3 text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                        Review account
                    </Link>
                </div>
                <div className="mt-24 grid gap-4 border-t border-border pt-6 text-xs text-muted-foreground md:grid-cols-3">
                    <p>
                        <span className="block font-semibold text-foreground">
                            Explore
                        </span>
                        Spatial navigation is coming.
                    </p>
                    <p>
                        <span className="block font-semibold text-foreground">
                            Work
                        </span>
                        Documents and databases follow.
                    </p>
                    <p>
                        <span className="block font-semibold text-foreground">
                            Jump
                        </span>
                        Search Master arrives later.
                    </p>
                </div>
            </section>
        </>
    );
}
