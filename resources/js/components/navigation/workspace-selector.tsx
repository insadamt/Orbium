import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type { WorkspaceSummary } from '@/components/hierarchy/workspace-panel';
import { openLocation } from './tab-navigation';
import { AppSelect } from '@/components/ui/app-select';

type WorkspacePageProps = {
    workspace?: { id: number; name: string };
    workspaces?: WorkspaceSummary[];
};

export function WorkspaceSelector() {
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
            openLocation('/settings/workspaces');
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
            <AppSelect
                label="Select workspace"
                value={selectedId ? String(selectedId) : ''}
                onValueChange={selectWorkspace}
                placeholder="Workspaces"
                className="max-w-44 border-0 bg-transparent py-2 pr-1 pl-9 font-semibold shadow-none sm:max-w-60"
                options={[
                    ...workspaces.map((item) => ({
                        value: String(item.id),
                        label: item.name,
                    })),
                    { value: 'manage', label: 'Manage workspaces…' },
                ]}
            />
        </div>
    );
}
