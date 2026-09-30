import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type { WorkspaceSummary } from '@/components/hierarchy/workspace-panel';
import { openLocation } from './tab-navigation';

type WorkspacePageProps = {
    workspace?: { id: number; name: string };
    workspaces?: WorkspaceSummary[];
};

type Props = {
    onManage: () => void;
};

export function WorkspaceSelector({ onManage }: Props) {
    const { workspace, workspaces = [] } = usePage<WorkspacePageProps>().props;
    const [lastWorkspaceId, setLastWorkspaceId] = useState<number | null>(
        () => {
            try {
                return (
                    Number(localStorage.getItem('orbium.lastWorkspaceId')) ||
                    null
                );
            } catch {
                return null;
            }
        },
    );

    useEffect(() => {
        if (!workspace?.id) return;
        setLastWorkspaceId(workspace.id);
        try {
            localStorage.setItem(
                'orbium.lastWorkspaceId',
                String(workspace.id),
            );
        } catch {
            // Browser storage can be unavailable without affecting navigation.
        }
    }, [workspace?.id]);

    const selectedId =
        workspace?.id ??
        workspaces.find((item) => item.id === lastWorkspaceId)?.id ??
        workspaces[0]?.id;

    function selectWorkspace(value: string) {
        if (value === 'manage') {
            onManage();
            return;
        }
        const id = Number(value);
        if (!id || id === workspace?.id) return;
        setLastWorkspaceId(id);
        openLocation(`/workspaces/${id}`);
    }

    return (
        <div className="relative min-w-0 shrink-0">
            <span
                aria-hidden="true"
                className="orbium-mark pointer-events-none absolute top-1/2 left-0 -translate-y-1/2"
            />
            <select
                aria-label="Select workspace"
                value={selectedId ? String(selectedId) : ''}
                onChange={(event) => {
                    const value = event.currentTarget.value;
                    event.currentTarget.value = selectedId
                        ? String(selectedId)
                        : '';
                    selectWorkspace(value);
                }}
                className="max-w-44 cursor-pointer appearance-auto border-0 bg-transparent py-2 pr-1 pl-9 text-sm font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-w-60"
            >
                {!selectedId && <option value="">Workspaces</option>}
                {workspaces.map((item) => (
                    <option key={item.id} value={item.id}>
                        {item.name}
                    </option>
                ))}
                <option value="manage">Manage workspaces…</option>
            </select>
        </div>
    );
}
