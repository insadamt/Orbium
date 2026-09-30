import { router } from '@inertiajs/react';
import { RotateCcw, X } from 'lucide-react';
import type { TrashedNode } from './node-browser';

type Props = {
    workspaceId: number;
    nodes: TrashedNode[];
    onClose: () => void;
};

export default function OrbitalTrash({ workspaceId, nodes, onClose }: Props) {
    return (
        <div className="orbital-panel-backdrop" onClick={onClose}>
            <section
                className="orbital-panel"
                aria-label="Trash"
                onClick={(event) => event.stopPropagation()}
            >
                <button
                    type="button"
                    className="orbital-panel-close"
                    aria-label="Close trash"
                    onClick={onClose}
                >
                    <X size={18} />
                </button>
                <h2 className="text-lg font-semibold">Trash</h2>
                {nodes.length === 0 ? (
                    <p className="mt-5 text-sm text-muted-foreground">
                        Trash is empty.
                    </p>
                ) : (
                    <div className="mt-5 divide-y divide-border">
                        {nodes.map((node) => (
                            <div
                                key={node.id}
                                className="flex items-center justify-between gap-3 py-3 text-sm"
                            >
                                <span className="min-w-0 truncate">
                                    {node.title}{' '}
                                    <span className="text-muted-foreground">
                                        · {node.type}
                                    </span>
                                </span>
                                <button
                                    type="button"
                                    aria-label={`Restore ${node.title}`}
                                    onClick={() =>
                                        router.post(
                                            `/workspaces/${workspaceId}/nodes/${node.id}/restore`,
                                        )
                                    }
                                    className="rounded-md p-2 hover:bg-accent"
                                >
                                    <RotateCcw size={17} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
