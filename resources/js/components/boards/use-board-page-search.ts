import {
    fetchMentionCandidates,
    type PageMentionCandidate,
} from '@/components/editor/mention-candidates';
import { useEffect, useState } from 'react';
import {
    readResource,
    resourceBaseUrl,
    resourceResponse,
} from './board-resource-api';
import type { BoardLocation } from './board-types';

export function useBoardPageSearch({
    workspaceId,
    boardId,
    query,
    after = 0,
    documentsOnly = false,
    enabled,
}: BoardLocation & {
    query: string;
    after?: number;
    documentsOnly?: boolean;
    enabled: boolean;
}) {
    const [result, setResult] = useState<{
        key: string;
        resources: PageMentionCandidate[];
        next: number | null;
        loading: boolean;
        error: string;
    }>({ key: '', resources: [], next: null, loading: false, error: '' });
    const key = `${workspaceId}:${boardId}:${documentsOnly}:${query}`;
    useEffect(() => {
        if (!enabled) return;
        const controller = new AbortController();
        const timer = window.setTimeout(() => {
            setResult((current) => ({ ...current, loading: true, error: '' }));
            const params = new URLSearchParams({
                q: query.slice(0, 120),
                after: String(after),
            });
            if (documentsOnly) params.set('type', 'document');
            const request = documentsOnly
                ? fetch(
                      `${resourceBaseUrl({ workspaceId, boardId })}/resources?${params}`,
                      {
                          headers: { Accept: 'application/json' },
                          cache: 'no-store',
                          signal: controller.signal,
                      },
                  )
                      .then(resourceResponse)
                      .then((value) => {
                          const data = value as {
                              resources: unknown[];
                              next: number | null;
                          };
                          return {
                              resources: data.resources.map(readResource),
                              next: data.next,
                          };
                      })
                : fetchMentionCandidates({
                      workspaceId,
                      sourceId: boardId,
                      query,
                      signal: controller.signal,
                  }).then((resources) => ({ resources, next: null }));
            void request
                .then((value) => {
                    const data = value;
                    const resources = data.resources;
                    if (controller.signal.aborted) return;
                    setResult((current) => ({
                        key,
                        resources:
                            after && current.key === key
                                ? [
                                      ...current.resources,
                                      ...resources.filter(
                                          (item) =>
                                              !current.resources.some(
                                                  (previous) =>
                                                      previous.id === item.id,
                                              ),
                                      ),
                                  ]
                                : resources,
                        next: data.next,
                        loading: false,
                        error: '',
                    }));
                })
                .catch((failure: unknown) => {
                    if (!controller.signal.aborted)
                        setResult({
                            key,
                            resources: [],
                            next: null,
                            loading: false,
                            error:
                                failure instanceof Error
                                    ? failure.message
                                    : 'Could not find pages. Try again.',
                        });
                });
        }, 180);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [enabled, workspaceId, boardId, query, after, documentsOnly, key]);
    //
    // Hide results from the previous query immediately so a fast Enter cannot insert the wrong page during debounce.
    //
    return result.key === key
        ? result
        : { resources: [], next: null, loading: enabled, error: '' };
}
