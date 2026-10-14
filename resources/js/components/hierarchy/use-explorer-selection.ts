import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { TreeNode } from '@/components/navigation/navigation-types';

export function useExplorerSelection(
    workspaceId: number,
    visibleNodes: TreeNode[],
) {
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [busy, setBusy] = useState(false);
    const selectedNodes = visibleNodes.filter((node) =>
        selectedIds.includes(node.id),
    );
    const visibleSelectedIds = selectedNodes.map((node) => node.id);

    function toggleSelection(nodeId: number) {
        if (busy) return;
        if (
            !visibleSelectedIds.includes(nodeId) &&
            visibleSelectedIds.length >= 100
        ) {
            toast.error('Select up to 100 items at a time.');
            return;
        }
        setSelectedIds(
            visibleSelectedIds.includes(nodeId)
                ? visibleSelectedIds.filter((id) => id !== nodeId)
                : [...visibleSelectedIds, nodeId],
        );
    }

    function submitBulkAction(
        action: 'move' | 'trash',
        parentId: number | null = null,
        position?: number,
        onSuccess?: () => void,
    ) {
        if (busy || visibleSelectedIds.length === 0) return;
        setBusy(true);
        router.post(
            `/workspaces/${workspaceId}/nodes/bulk`,
            {
                node_ids: visibleSelectedIds,
                action,
                parent_id: parentId,
                ...(position === undefined ? {} : { position }),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedIds([]);
                    toast.success(
                        action === 'move'
                            ? 'Selected items moved.'
                            : 'Selected items moved to Trash.',
                    );
                    onSuccess?.();
                },
                onError: (errors) => toast.error(Object.values(errors)[0]),
                onFinish: () => setBusy(false),
            },
        );
    }

    return {
        selectedNodes,
        selectedIds: visibleSelectedIds,
        busy,
        toggleSelection,
        clearSelection: () => {
            if (!busy) setSelectedIds([]);
        },
        submitBulkAction,
    };
}
