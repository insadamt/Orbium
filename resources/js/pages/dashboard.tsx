import { Head, usePage } from '@inertiajs/react';
import type { HierarchyNode } from '@/components/hierarchy/node-browser';
import { NodeMediaHeader } from '@/components/hierarchy/node-media-header';
import { WorkspaceContents } from '@/components/hierarchy/workspace-contents';
import type { WorkspaceSummary } from '@/components/hierarchy/workspace-panel';
import type { GalleryAppearance } from '@/components/hierarchy/cover-presentation';
import { useContainerView } from '@/components/navigation/use-container-view';
import type { ExplorerView } from '@/components/hierarchy/explorer-view-controls';

import type { OrbingLink } from '@/components/hierarchy/orbing/orbing-layout';

type DashboardProps = {
    workspace?: WorkspaceSummary;
    nodes?: HierarchyNode[];
    mentionLinks?: OrbingLink[];
    currentNode?: HierarchyNode | null;
    galleryConfig?: (GalleryAppearance & { legacy_preview?: boolean }) | null;
    errors: Record<string, string>;
};

export default function Dashboard() {
    const {
        workspace,
        nodes = [],
        mentionLinks = [],
        currentNode = null,
        errors,
        galleryConfig,
    } = usePage<DashboardProps>().props;
    const [view] = useContainerView<ExplorerView>(
        `explorer.${workspace?.id}.${currentNode?.id ?? 'root'}.view`,
        'grid',
    );
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
                    {currentNode?.type === 'folder' && view !== 'orbing' && (
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
                                    cover_aspect_ratio:
                                        currentNode.cover_aspect_ratio ?? null,
                                    icon_attachment_id:
                                        currentNode.icon_attachment_id ?? null,
                                }}
                            />
                        </div>
                    )}
                    <WorkspaceContents
                        key={`${workspace.id}-${currentNode?.id ?? 'root'}`}
                        workspaceId={workspace.id}
                        workspaceName={workspace.name}
                        nodes={nodes}
                        mentionLinks={mentionLinks}
                        parentId={currentNode?.id ?? null}
                        initialGalleryConfig={galleryConfig}
                    />
                </>
            )}
        </>
    );
}
