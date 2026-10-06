import { router } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { fetchTrashData } from './trash-types';
import type { DeletionPreview, TrashSelection } from './trash-types';

type RestoreRequest = {
    selection: TrashSelection;
    ancestorsRequired?: boolean;
};

type Options = {
    onRequireAncestors: (selection: TrashSelection) => void;
    onCompleted: () => void;
};

export function useTrashRestoration({
    onRequireAncestors,
    onCompleted,
}: Options) {
    const [restoringKeys, setRestoringKeys] = useState<string[]>([]);
    const pending = useRef(false);

    async function restoreItems({
        selection,
        ancestorsRequired,
    }: RestoreRequest) {
        if (pending.current) return;
        if (ancestorsRequired) {
            onRequireAncestors(selection);
            return;
        }
        pending.current = true;
        setRestoringKeys(selection.keys);
        try {
            if (ancestorsRequired === undefined) {
                const preview = await fetchTrashData<DeletionPreview>(
                    '/trash/preview',
                    { keys: selection.keys, empty_scope: '0' },
                );
                if (
                    preview.entries.some(
                        (entry) => entry.restore_ancestors.length > 0,
                    )
                ) {
                    pending.current = false;
                    setRestoringKeys([]);
                    onRequireAncestors(selection);
                    return;
                }
            }
            router.post(
                '/trash/restore',
                { ...selection, restore_ancestors: false },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success(
                            selection.keys.length === 1
                                ? 'Item restored'
                                : 'Items restored',
                        );
                        onCompleted();
                    },
                    onError: (errors) =>
                        toast.error(Object.values(errors).join(' ')),
                    onFinish: () => {
                        pending.current = false;
                        setRestoringKeys([]);
                    },
                },
            );
        } catch (error) {
            pending.current = false;
            setRestoringKeys([]);
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Could not restore items.',
            );
        }
    }

    return { restoreItems, restoringKeys };
}
