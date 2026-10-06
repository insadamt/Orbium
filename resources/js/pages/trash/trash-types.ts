export type TrashEntry = {
    key: string;
    title: string;
    type: 'workspace' | 'folder' | 'database' | 'document';
    workspace_id: number;
    workspace_name: string;
    deleted_at: string;
    path: string;
    descendant_count: number;
    attachment_count: number;
    size_bytes: number;
    restore_ancestors: string[];
};

export type TrashChild = {
    key: string;
    parent_key: string;
    title: string;
    type: TrashEntry['type'];
    explicitly_trashed: boolean;
    path: string;
};

export type TrashDetails = {
    entry: TrashEntry;
    excerpt: string | null;
    children: TrashChild[];
};

export type TrashSelection = {
    keys: string[];
    empty_scope: boolean;
    workspace_id: number | null;
};

export type DeletionPreview = {
    entries: TrashEntry[];
    node_count: number;
    node_ids: number[];
    workspace_ids: number[];
    attachment_count: number;
    size_bytes: number;
    fingerprint: string;
};

export function formatStorageSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function fetchTrashData<T>(
    path: string,
    parameters: Record<string, string | string[]>,
    signal?: AbortSignal,
): Promise<T> {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(parameters)) {
        if (Array.isArray(value)) {
            value.forEach((item) => query.append(`${key}[]`, item));
        } else {
            query.set(key, value);
        }
    }
    const response = await fetch(`${path}?${query}`, {
        headers: { Accept: 'application/json' },
        signal,
    });
    if (!response.ok) {
        throw new Error(
            'Could not load this Trash information. Refresh the page and try again.',
        );
    }
    return response.json() as Promise<T>;
}
