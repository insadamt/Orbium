export const blockLabels = {
    paragraph: 'Paragraphs',
    heading_1: 'Heading 1',
    heading_2: 'Heading 2',
    heading_3: 'Heading 3',
    heading_4: 'Heading 4',
    heading_5: 'Heading 5',
    heading_6: 'Heading 6',
    bullet_list_item: 'Bullet list items',
    numbered_list_item: 'Numbered list items',
    checklist_item: 'Checklist items',
    quote: 'Quotes',
    callout: 'Callouts',
    code: 'Code blocks',
    table: 'Tables',
    image: 'Image blocks',
    file: 'File blocks',
    divider: 'Dividers',
    mermaid: 'Mermaid diagrams',
    math: 'Math blocks',
    mindmap: 'Mind Maps',
} as const;

export type StatisticsSummary = {
    scope: {
        kind: 'account' | 'workspace' | 'folder' | 'database' | 'document';
        name: string;
        workspace_id: number | null;
        node_id: number | null;
    };
    content: {
        workspaces: number | null;
        documents: number;
        folders: number | null;
        databases: number | null;
        database_entries: number | null;
    };
    writing: {
        words: number;
        characters: number;
        characters_without_spaces: number;
    } | null;
    blocks: Record<keyof typeof blockLabels, number> | null;
    total_blocks: number | null;
    checklist: { checked: number; unchecked: number } | null;
    inline_math: number | null;
    uploads: Record<
        'images' | 'files' | 'total',
        { count: number; size_bytes: number }
    > | null;
    completeness: { complete: boolean; pending_documents: number };
};

export type StatisticsTarget = {
    workspaceId: number | null;
    nodeId: number | null;
    title: string;
};
