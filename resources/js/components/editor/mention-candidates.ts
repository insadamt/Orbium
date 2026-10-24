export type PageMentionCandidate = {
    id: number;
    title: string;
    type: 'folder' | 'document' | 'database' | 'board';
    url: string;
    parent_title?: string | null;
};

export async function fetchMentionCandidates({
    workspaceId,
    sourceId,
    query,
    signal,
}: {
    workspaceId: number;
    sourceId: number;
    query: string;
    signal?: AbortSignal;
}): Promise<PageMentionCandidate[]> {
    const params = new URLSearchParams({
        q: query,
        source_id: String(sourceId),
    });
    const response = await fetch(
        `/workspaces/${workspaceId}/mentions?${params}`,
        {
            headers: { Accept: 'application/json' },
            signal,
            cache: 'no-store',
        },
    );
    if (!response.ok) throw new Error('Could not find pages to mention.');
    const candidates = (await response.json()) as PageMentionCandidate[];
    return candidates.filter((candidate) => candidate.id !== sourceId);
}
