import type { TreeNode } from '@/components/navigation/navigation-types';
import type { GalleryAppearance } from './cover-presentation';
import type { OrbingLink } from './orbing/orbing-layout';

export type WorkspaceContentsProps = {
    workspaceId: number;
    workspaceName: string;
    nodes: TreeNode[];
    mentionLinks?: OrbingLink[];
    parentId: number | null;
    initialGalleryConfig?:
        | (GalleryAppearance & { legacy_preview?: boolean })
        | null;
};
