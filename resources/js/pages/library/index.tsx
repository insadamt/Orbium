import { Head, usePage } from '@inertiajs/react';
import { LibraryBrowser } from '@/components/library/library-browser';

export default function LibraryPage() {
    const { workspace } = usePage<{ workspace: { id: number; name: string } }>()
        .props;
    return (
        <main className="mx-auto w-full max-w-6xl px-5 pt-28 pb-12">
            <Head title="Library" />
            <div className="mb-8">
                <h1 className="text-3xl font-semibold">Library</h1>
                <p className="mt-2 text-muted-foreground">
                    Files and images in {workspace.name}. Reuse uploads across
                    your pages.
                </p>
            </div>
            <LibraryBrowser key={workspace.id} workspaceId={workspace.id} />
        </main>
    );
}
