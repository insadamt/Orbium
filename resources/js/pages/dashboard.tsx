import { Head, usePage } from '@inertiajs/react';
import NodeBrowser, {
    type HierarchyNode,
    type TrashedNode,
} from '@/components/hierarchy/node-browser';
import WorkspacePanel, {
    type TrashedWorkspace,
    type WorkspaceSummary,
} from '@/components/hierarchy/workspace-panel';

type DashboardProps = {
    workspaces: WorkspaceSummary[];
    trashedWorkspaces: TrashedWorkspace[];
    workspace?: WorkspaceSummary;
    nodes?: HierarchyNode[];
    trashedNodes?: TrashedNode[];
    currentNode?: HierarchyNode | null;
    errors: Record<string, string>;
};

export default function Dashboard() {
    const {
        workspaces,
        trashedWorkspaces,
        workspace,
        nodes = [],
        trashedNodes = [],
        currentNode = null,
        errors,
    } = usePage<DashboardProps>().props;

    return (
        <>
            <Head title={currentNode?.title ?? workspace?.name ?? 'Home'} />
            {Object.keys(errors).length > 0 && (
                <div
                    role="alert"
                    className="mb-6 rounded-xl border border-destructive/50 px-4 py-3 text-sm text-destructive"
                >
                    {Object.values(errors).join(' ')}
                </div>
            )}
            <div className="flex flex-col gap-8 lg:flex-row">
                <WorkspacePanel
                    workspaces={workspaces}
                    trashedWorkspaces={trashedWorkspaces}
                    activeWorkspaceId={workspace?.id}
                />
                {workspace ? (
                    <NodeBrowser
                        workspaceId={workspace.id}
                        workspaceName={workspace.name}
                        nodes={nodes}
                        trashedNodes={trashedNodes}
                        currentNode={currentNode}
                    />
                ) : (
                    <section className="flex min-h-[55vh] flex-1 flex-col justify-center rounded-2xl border border-dashed border-border p-10">
                        <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                            Your space begins here
                        </p>
                        <h1 className="mt-4 text-4xl font-light tracking-tight md:text-6xl">
                            Create your first workspace.
                        </h1>
                        <p className="mt-5 max-w-lg text-muted-foreground">
                            Workspaces keep separate hierarchies for your
                            projects and ideas. Give one a name in the panel to
                            begin.
                        </p>
                    </section>
                )}
            </div>
        </>
    );
}
