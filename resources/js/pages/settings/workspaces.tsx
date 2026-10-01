import { Head, usePage } from '@inertiajs/react';
import WorkspacePanel, {
    type TrashedWorkspace,
    type WorkspaceSummary,
} from '@/components/hierarchy/workspace-panel';

type PageProps = {
    workspaces: WorkspaceSummary[];
    trashedWorkspaces: TrashedWorkspace[];
};

export default function Workspaces() {
    const { workspaces, trashedWorkspaces } = usePage<PageProps>().props;

    return (
        <>
            <Head title="Workspace settings" />
            <WorkspacePanel
                workspaces={workspaces}
                trashedWorkspaces={trashedWorkspaces}
            />
        </>
    );
}
