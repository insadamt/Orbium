import type { TreeNode } from '@/components/navigation/navigation-types';
import type { GalleryAppearance } from './cover-presentation';

export type WorkspaceContentsProps = {
    workspaceId: number;
    nodes: TreeNode[];
    parentId: number | null;
    initialGalleryConfig?:
        | (GalleryAppearance & { legacy_preview?: boolean })
        | null;
};
