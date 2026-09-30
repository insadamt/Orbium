export type TreeNode = {
    id: number;
    parent_id: number | null;
    title: string;
    type: 'folder' | 'document' | 'database';
    position: number;
    tags?: string[];
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
    const segment =
        node.type === 'document'
            ? 'documents'
            : node.type === 'database'
              ? 'databases'
              : 'nodes';
    return `/workspaces/${workspaceId}/${segment}/${node.id}`;
}
