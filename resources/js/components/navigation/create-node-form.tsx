import { router } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import type { TreeNode } from './navigation-types';

type Props = {
    workspaceId: number;
    parentId: number | null;
    type: TreeNode['type'];
    revealInOrbit?: boolean;
    onCancel: () => void;
    onCreated: () => void;
};

export function CreateNodeForm({
    workspaceId,
    parentId,
    type,
    revealInOrbit = false,
    onCancel,
    onCreated,
}: Props) {
    const [title, setTitle] = useState('');
    const [saving, setSaving] = useState(false);

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!title.trim() || saving) return;
        setSaving(true);
        router.post(
            `/workspaces/${workspaceId}/nodes`,
            {
                type,
                title: title.trim(),
                parent_id: parentId,
                reveal_in_orbit: revealInOrbit,
            },
            {
                onSuccess: onCreated,
                onError: (errors) => toast.error(Object.values(errors)[0]),
                onFinish: () => setSaving(false),
            },
        );
    }

    return (
        <form
            onSubmit={submit}
            className="space-y-3 rounded-xl border border-border bg-background p-4"
        >
            <div>
                <p className="text-sm font-medium">New {type}</p>
                <p className="text-xs text-muted-foreground">
                    Create it in the current location.
                </p>
            </div>
            <input
                autoFocus
                aria-label={`New ${type} title`}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={255}
                placeholder={`${type[0].toUpperCase()}${type.slice(1)} name`}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="flex justify-end gap-2 text-sm">
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-lg px-3 py-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={!title.trim() || saving}
                    className="rounded-lg bg-foreground px-4 py-2 font-medium text-background disabled:opacity-40"
                >
                    {saving ? 'Creating…' : 'Create'}
                </button>
            </div>
        </form>
    );
}
