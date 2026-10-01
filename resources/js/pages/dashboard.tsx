import { Head, usePage } from '@inertiajs/react';
import type { HierarchyNode } from '@/components/hierarchy/node-browser';
import { NodeMediaHeader } from '@/components/hierarchy/node-media-header';
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
                <>
                    {currentNode?.type === 'folder' && (
                        <div className="floating-folder-header">
                            <NodeMediaHeader
                                key={currentNode.id}
                                workspaceId={workspace.id}
                                node={{
                                    id: currentNode.id,
                                    title: currentNode.title,
                                    type: 'folder',
                                    icon: currentNode.icon ?? null,
                                    cover_attachment_id:
                                        currentNode.cover_attachment_id ?? null,
                                    icon_attachment_id:
                                        currentNode.icon_attachment_id ?? null,
                                }}
                            />
                        </div>
                    )}
                    <WorkspaceContents
                        key={`${workspace.id}-${currentNode?.id ?? 'root'}`}
                        workspaceId={workspace.id}
                        nodes={nodes}
                        parentId={currentNode?.id ?? null}
                    />
                </>
            )}
        </>
    );
}
