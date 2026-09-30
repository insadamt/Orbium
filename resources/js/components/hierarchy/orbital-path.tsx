import { nodeUrl } from '@/components/navigation/navigation-types';
import { openLocation } from '@/components/navigation/tab-navigation';
import type { HierarchyNode } from './node-browser';
import type { WorkspaceSummary } from './workspace-panel';

type Props = {
    workspace: WorkspaceSummary;
    currentNode: HierarchyNode | null;
    nodes: HierarchyNode[];
};

function ancestorsOf(node: HierarchyNode | null, nodes: HierarchyNode[]) {
    const ancestors: HierarchyNode[] = [];
    let ancestor = node;
    while (ancestor) {
        ancestors.unshift(ancestor);
        ancestor =
            nodes.find((candidate) => candidate.id === ancestor?.parent_id) ??
            null;
    }
    return ancestors;
}

export default function OrbitalPath({ workspace, currentNode, nodes }: Props) {
    return (
        <nav className="orbital-path" aria-label="Location">
            <button
                type="button"
                onClick={() =>
                    openLocation(`/workspaces/${workspace.id}?explore=1`)
                }
            >
                {workspace.name}
            </button>
            {ancestorsOf(currentNode, nodes).map((node) => (
                <button
                    type="button"
                    key={node.id}
                    onClick={() =>
                        openLocation(`${nodeUrl(workspace.id, node)}?explore=1`)
                    }
                >
                    {' '}
                    / {node.title}
                </button>
            ))}
        </nav>
    );
}
