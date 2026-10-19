import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { TreeNode } from './navigation-types';

export function useNodeFavorite(
    workspaceId: number,
    node: Pick<TreeNode, 'id' | 'is_favorite'> | undefined,
) {
    const [savingFavorite, setSavingFavorite] = useState(false);

    function toggleFavorite() {
        if (!node || savingFavorite) return;
        setSavingFavorite(true);
        router.patch(
            `/workspaces/${workspaceId}/nodes/${node.id}/favorite`,
            { is_favorite: !node.is_favorite },
            {
                preserveScroll: true,
                onError: (errors) => toast.error(Object.values(errors)[0]),
                onFinish: () => setSavingFavorite(false),
            },
        );
    }

    return { savingFavorite, toggleFavorite };
}
