import type { CoverRatio } from '@/components/hierarchy/cover-presentation';

export type TreeNode = {
    id: number;
    parent_id: number | null;
    title: string;
    type: 'folder' | 'document' | 'database' | 'board';
    position: number;
    icon?: string | null;
    cover_attachment_id?: number | null;
    cover_aspect_ratio?: CoverRatio | null;
    icon_attachment_id?: number | null;
    tags?: string[];
    is_favorite?: boolean;
};
export type SearchResult = TreeNode & {
    label: string;
    find: string | null;
    path: string;
    snippet: string;
    match: string;
    url: string;
};
export function nodeUrl(
    workspaceId: number,
    node: Pick<TreeNode, 'id' | 'type'>,
) {
    const segment = {
        document: 'documents',
        database: 'databases',
        board: 'boards',
        folder: 'nodes',
    }[node.type];
    return `/workspaces/${workspaceId}/${segment}/${node.id}`;
}
