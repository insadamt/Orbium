import { usePage } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { nodeUrl } from '@/components/navigation/navigation-types';
import { openLocation } from '@/components/navigation/tab-navigation';
import { useTabView } from '@/components/navigation/use-tab-view';
import { useNavigation } from '@/components/navigation/navigation-store';
import {
    useOrbitInteraction,
    useReducedOrbitMotion,
} from './orbit-preferences';
import { enterOrbitLocation } from './orbit-navigation';
import OrbitSystem from './orbit-system';
import type { OrbitNode } from './orbit-types';

type Props = {
    workspaceId: number;
    center: OrbitNode;
    nodes: OrbitNode[];
    emptyMessage?: string;
};

export default function OrbitView(props: Props) {
    const activeId = useNavigation((state) => state.activeId);
    const page = usePage();
    return (
        <OrbitContext
            key={`${activeId}:${page.url}:${props.center.id}`}
            {...props}
        />
    );
}

function OrbitContext({
    workspaceId,
    center,
    nodes,
    emptyMessage = 'Nothing here yet. Use New to create your first item.',
}: Props) {
    const page = usePage();
    const focusId =
        Number(
            new URLSearchParams(page.url.split('?')[1] ?? '').get('focus'),
        ) || null;
    const [selectedId, setSelectedId] = useTabView<number | null>(
        `orbit.${workspaceId}.${center.id}.selected`,
        focusId,
    );
    const [query, setQuery] = useState('');
    const opening = useRef(false);
    const reducedMotion = useReducedOrbitMotion();
    const paused = useOrbitInteraction((state) => state.paused);
    const shown = nodes.filter((node) =>
        node.title.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
    );
    const selected = nodes.find((node) => node.id === selectedId);

    function openNode(node: OrbitNode, source: HTMLElement | null = null) {
        if (opening.current) return;
        opening.current = true;
        if (node.type === 'workspace') return;
        const url =
            nodeUrl(workspaceId, { id: node.id, type: node.type }) +
            (node.type === 'folder' || node.type === 'database'
                ? '?view=orbit'
                : '');
        if (node.type === 'document') {
            openLocation(url);
            return;
        }
        const orb =
            source ??
            document.querySelector<HTMLElement>(
                `.orbium-child[data-orbit-node-id="${node.id}"]`,
            );
        enterOrbitLocation(url, workspaceId, node.id, orb, reducedMotion);
    }

    return (
        <section aria-label="Orbit" className="orbium-orbit-view">
            <div
                className={`orbium-orbit-stage${reducedMotion ? ' is-reduced-motion' : ''}${paused ? ' is-paused' : ''}`}
            >
                <OrbitSystem
                    workspaceId={workspaceId}
                    center={center}
                    nodes={shown}
                    selectedId={selected?.id ?? null}
                    onSelect={setSelectedId}
                    onOpen={openNode}
                    reducedMotion={reducedMotion}
                />
                {!nodes.length && (
                    <p className="orbium-orbit-empty">{emptyMessage}</p>
                )}
            </div>
            {selected && (
                <div className="orbium-orbit-selection">
                    <span className="min-w-0 truncate">
                        {selected.title}{' '}
                        <span className="text-muted-foreground">
                            · {selected.type}
                        </span>
                    </span>
                    <button
                        type="button"
                        onClick={() => openNode(selected)}
                        className="orbium-orbit-open"
                    >
                        {selected.type === 'document'
                            ? 'Open document'
                            : 'Enter orbit'}
                    </button>
                </div>
            )}
            {focusId && !nodes.some((node) => node.id === focusId) && (
                <p role="status" className="orbium-orbit-unavailable">
                    The requested item is unavailable here or hidden by this
                    view’s filters.
                </p>
            )}
            <details
                className="orbium-orbit-browser glass-surface"
                open={nodes.length > 40 || undefined}
            >
                <summary className="cursor-pointer text-sm">
                    Browse items ({nodes.length})
                </summary>
                <input
                    aria-label="Filter Orbit items"
                    placeholder="Filter this location…"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="my-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
                <div className="grid max-h-64 gap-1 overflow-y-auto sm:grid-cols-2">
                    {shown.map((node) => (
                        <div
                            key={node.id}
                            className="flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent"
                        >
                            <button
                                type="button"
                                className="min-w-0 flex-1 truncate text-left text-sm"
                                aria-pressed={selectedId === node.id}
                                onClick={() => setSelectedId(node.id)}
                            >
                                {node.title}
                                <span className="ml-2 text-xs text-muted-foreground">
                                    {node.type}
                                </span>
                            </button>
                            <button
                                type="button"
                                className="rounded px-2 py-1 text-xs hover:bg-background"
                                aria-label={`Open ${node.title}`}
                                onClick={() => openNode(node)}
                            >
                                Open
                            </button>
                        </div>
                    ))}
                </div>
                {!shown.length && (
                    <p className="py-3 text-sm text-muted-foreground">
                        No matching items.
                    </p>
                )}
            </details>
        </section>
    );
}
