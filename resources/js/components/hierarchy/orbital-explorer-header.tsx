import { Plus, Search, Settings2 } from 'lucide-react';
import { openLocation } from '@/components/navigation/tab-navigation';
import type { HierarchyNode } from './node-browser';

type Props = {
    workspaceId: number;
    currentNode: HierarchyNode | null;
    onShowWorkspaces: () => void;
    onManageWorkspaces: () => void;
};

export default function OrbitalExplorerHeader({
    workspaceId,
    currentNode,
    onShowWorkspaces,
    onManageWorkspaces,
}: Props) {
    return (
        <header className="orbital-floating-header">
            <button
                type="button"
                className="orbital-wordmark"
                onClick={() =>
                    currentNode
                        ? openLocation(`/workspaces/${workspaceId}`)
                        : onShowWorkspaces()
                }
                aria-label="Show workspaces"
            >
                ORBIUM<span>✦</span>
            </button>
            <div className="orbital-utilities">
                <button
                    type="button"
                    aria-label="Search"
                    title="Search (Ctrl + Space)"
                    onClick={() =>
                        window.dispatchEvent(new Event('orbium:open-search'))
                    }
                >
                    <Search size={20} />
                </button>
                <button
                    type="button"
                    aria-label="Manage workspaces"
                    title="Manage workspaces"
                    onClick={onManageWorkspaces}
                >
                    <Plus size={21} />
                </button>
                <button
                    type="button"
                    aria-label="Settings"
                    title="Settings"
                    onClick={() => openLocation('/settings/profile')}
                >
                    <Settings2 size={20} />
                </button>
            </div>
        </header>
    );
}
