import { BoardDocumentSnapshotCache } from './board-document-snapshot-cache';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import type { BoardLocation } from './board-types';
import type { BoardResource } from './board-resource-types';
import {
    readResource,
    resourceBaseUrl,
    resourceResponse,
} from './board-resource-api';

type Preview = { resource?: BoardResource; error?: string; missing?: boolean };
type PreviewContext = {
    documents: BoardDocumentSnapshotCache;
    entries: Record<number, Preview>;
    register: (id: number) => () => void;
    refresh: (id: number) => void;
};
const ResourcePreviews = createContext<PreviewContext | null>(null);
export function BoardResourcePreviews({
    location,
    children,
}: {
    location: BoardLocation;
    children: ReactNode;
}) {
    const [documents] = useState(() => new BoardDocumentSnapshotCache());
    const [entries, setEntries] = useState<Record<number, Preview>>({});
    const targets = useRef(new Map<number, number>());
    const checked = useRef(new Map<number, number>());
    const queued = useRef(new Set<number>());
    const request = useRef<AbortController | null>(null);
    const timer = useRef<number | undefined>(undefined);
    const mounted = useRef(false);
    const run = useCallback(async () => {
        if (!mounted.current || request.current) return;
        const ids = [...queued.current]
            .filter((id) => targets.current.has(id))
            .slice(0, 40);
        if (!ids.length) return;
        ids.forEach((id) => queued.current.delete(id));
        const controller = new AbortController();
        request.current = controller;
        try {
            const query = new URLSearchParams();
            ids.forEach((id) => query.append('ids[]', String(id)));
            const response = await fetch(
                `${resourceBaseUrl(location)}/resources/previews?${query}`,
                {
                    headers: { Accept: 'application/json' },
                    cache: 'no-store',
                    signal: controller.signal,
                },
            );
            const data = (await resourceResponse(response)) as {
                resources?: unknown[];
            } | null;
            if (!Array.isArray(data?.resources))
                throw new Error('Invalid resource previews.');
            const resources = new Map(
                data.resources.map((value) => {
                    const resource = readResource(value);
                    return [resource.id, resource];
                }),
            );
            if (!mounted.current || controller.signal.aborted) return;
            setEntries((current) => {
                const next = { ...current };
                for (const id of ids) {
                    checked.current.set(id, Date.now());
                    next[id] = resources.has(id)
                        ? { resource: resources.get(id) }
                        : { missing: true };
                }
                const inactive = Object.keys(next)
                    .map(Number)
                    .filter((id) => !targets.current.has(id));
                while (Object.keys(next).length > 200 && inactive.length) {
                    const id = inactive.shift()!;
                    delete next[id];
                    checked.current.delete(id);
                }
                return next;
            });
        } catch (failure) {
            if (!controller.signal.aborted && mounted.current)
                setEntries((current) => ({
                    ...current,
                    ...Object.fromEntries(
                        ids.map((id) => [
                            id,
                            {
                                error:
                                    failure instanceof Error
                                        ? failure.message
                                        : 'Could not refresh this resource.',
                            },
                        ]),
                    ),
                }));
        } finally {
            request.current = null;
            if (controller.signal.aborted && mounted.current)
                ids.forEach((id) => {
                    if (targets.current.has(id)) queued.current.add(id);
                });
            if (mounted.current && queued.current.size)
                timer.current = window.setTimeout(() => void run(), 0);
        }
    }, [location]);
    const refresh = useCallback(
        (id: number, invalidateDocument = true) => {
            if (invalidateDocument) documents.invalidate(id);
            queued.current.add(id);
            clearTimeout(timer.current);
            timer.current = window.setTimeout(() => void run(), 0);
        },
        [run, documents],
    );
    const register = useCallback(
        (id: number) => {
            targets.current.set(id, (targets.current.get(id) ?? 0) + 1);
            if (Date.now() - (checked.current.get(id) ?? 0) > 10_000)
                refresh(id, false);
            return () => {
                const count = targets.current.get(id) ?? 1;
                if (count <= 1) {
                    targets.current.delete(id);
                    queued.current.delete(id);
                } else targets.current.set(id, count - 1);
            };
        },
        [refresh],
    );
    useEffect(() => {
        mounted.current = true;
        const update = () => {
            if (document.visibilityState === 'visible') {
                for (const id of targets.current.keys()) queued.current.add(id);
                void run();
            }
        };
        const saved = (event: Event) => {
            const details = (
                event as CustomEvent<{ workspaceId: number; nodeId: number }>
            ).detail;
            if (
                details.workspaceId === location.workspaceId &&
                targets.current.has(details.nodeId)
            )
                refresh(details.nodeId);
        };
        const interval = window.setInterval(update, 30_000);
        window.addEventListener('focus', update);
        document.addEventListener('visibilitychange', update);
        window.addEventListener('orbium:resource-document-saved', saved);
        void run();
        return () => {
            mounted.current = false;
            clearTimeout(timer.current);
            clearInterval(interval);
            request.current?.abort();
            window.removeEventListener('focus', update);
            document.removeEventListener('visibilitychange', update);
            window.removeEventListener('orbium:resource-document-saved', saved);
        };
    }, [location.workspaceId, refresh, run]);
    return (
        <ResourcePreviews.Provider
            value={{ entries, register, refresh, documents }}
        >
            {children}
        </ResourcePreviews.Provider>
    );
}
export function useBoardResourcePreview(id: number) {
    const context = useContext(ResourcePreviews);
    const register = context?.register;
    useEffect(() => register?.(id), [id, register]);
    return {
        preview: context?.entries[id],
        refresh: () => context?.refresh(id),
    };
}

export function useBoardDocumentSnapshots() {
    const context = useContext(ResourcePreviews);
    if (!context)
        throw new Error('Board Document previews require a Board provider.');
    return context.documents;
}
