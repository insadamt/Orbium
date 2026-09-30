import { Head, usePage } from '@inertiajs/react';
import type { HierarchyNode } from '@/components/hierarchy/node-browser';
import { WorkspaceContents } from '@/components/hierarchy/workspace-contents';
import type { WorkspaceSummary } from '@/components/hierarchy/workspace-panel';

type DashboardProps = {
    workspace?: WorkspaceSummary;
    nodes?: HierarchyNode[];
    currentNode?: HierarchyNode | null;
    errors: Record<string, string>;
};

export default function Dashboard() {
    const {
        workspace,
        nodes = [],
        currentNode = null,
        errors,
    } = usePage<DashboardProps>().props;
    return (
        <>
            <Head title={currentNode?.title ?? workspace?.name ?? 'Home'} />
            {Object.keys(errors).length > 0 && (
                <p role="alert" className="mx-8 mt-6 text-sm text-destructive">
                    {Object.values(errors).join(' ')}
                </p>
            )}
            {workspace && (
                <WorkspaceContents
                    key={`${workspace.id}-${currentNode?.id ?? 'root'}`}
                    workspaceId={workspace.id}
                    nodes={nodes}
                    parentId={currentNode?.id ?? null}
                />
            )}
        </>
    );
}
