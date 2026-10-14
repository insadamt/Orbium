import { router } from '@inertiajs/react';
import { toast } from 'sonner';

type TrashExplorerNodesRequest = {
    workspaceId: number;
    nodeIds: number[];
    onSuccess?: () => void;
    onFinish?: () => void;
};

export function trashExplorerNodes({
    workspaceId,
    nodeIds,
    onSuccess,
    onFinish,
}: TrashExplorerNodesRequest): Promise<boolean> {
    return new Promise((resolve) => {
        let succeeded = false;
        router.post(
            `/workspaces/${workspaceId}/nodes/bulk`,
            { action: 'trash', node_ids: nodeIds },
            {
                preserveScroll: true,
                onSuccess: () => {
                    succeeded = true;
                    toast.success(
                        nodeIds.length === 1
                            ? 'Item moved to Trash.'
                            : 'Selected items moved to Trash.',
                    );
                    onSuccess?.();
                },
                onError: (errors) => toast.error(Object.values(errors)[0]),
                onFinish: () => {
                    onFinish?.();
                    resolve(succeeded);
                },
            },
        );
    });
}
