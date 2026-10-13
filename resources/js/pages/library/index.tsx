import { Head, usePage } from '@inertiajs/react';
import { LibraryBrowser } from '@/components/library/library-browser';

export default function LibraryPage() {
    const { workspace } = usePage<{ workspace: { id: number; name: string } }>()
        .props;
    return (
        <main className="library-page">
            <Head title="Library" />
            <header className="library-heading">
                <div>
                    <p className="library-eyebrow">{workspace.name}</p>
                    <h1>Library</h1>
                </div>
                <p>Upload once. Reuse anywhere in this workspace.</p>
            </header>
            <LibraryBrowser key={workspace.id} workspaceId={workspace.id} />
        </main>
    );
}
