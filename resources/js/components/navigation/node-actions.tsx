import { router } from '@inertiajs/react';
import {
    ArrowUpRight,
    FilePlus2,
    FolderPlus,
    Database,
    Pencil,
    Orbit,
    Tags,
    Trash2,
    X,
} from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { csrfToken } from '@/components/editor/editor-api';
import { CreateNodeForm } from './create-node-form';
import type { TreeNode } from './navigation-types';
import { nodeUrl, orbitRevealUrl } from './navigation-types';

type Props = {
    workspaceId: number;
    node: TreeNode;
    nodes: TreeNode[];
    onClose: () => void;
    onDismiss: () => void;
    onTagsSaved: (id: number, tags: string[]) => void;
    onOpen: (url: string, newTab?: boolean) => void;
    onMove: (nodeId: number, parentId: number | null, position: number) => void;
};
type Editor = 'rename' | 'tags' | 'trash' | 'move' | null;
const actionClass =
    'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export function NodeActions({
    workspaceId,
    node,
    nodes,
    onClose,
    onDismiss,
    onTagsSaved,
    onOpen,
    onMove,
}: Props) {
    const [editor, setEditor] = useState<Editor>(null);
    const [createType, setCreateType] = useState<TreeNode['type'] | null>(null);
    const [title, setTitle] = useState(node.title);
    const [tags, setTags] = useState(node.tags?.join(', ') ?? '');
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        setEditor(null);
        setCreateType(null);
        setTitle(node.title);
        setTags(node.tags?.join(', ') ?? '');
    }, [node.id, node.title, node.tags]);
    function reportErrors(errors: Record<string, string>) {
        toast.error(Object.values(errors)[0]);
        setSaving(false);
    }
    function rename(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!title.trim() || saving) return;
        setSaving(true);
        router.patch(
            `/workspaces/${workspaceId}/nodes/${node.id}`,
            { title: title.trim() },
            {
                preserveScroll: true,
                onSuccess: onClose,
                onError: reportErrors,
                onFinish: () => setSaving(false),
            },
        );
    }
    async function saveTags(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (saving) return;
        setSaving(true);
        const nextTags = tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean);
        try {
            const response = await fetch(
                `/workspaces/${workspaceId}/nodes/${node.id}/tags`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-CSRF-TOKEN': csrfToken(),
                    },
                    body: JSON.stringify({ tags: nextTags }),
                },
            );
            if (!response.ok)
                throw new Error(
                    'Could not save tags. Use letters, numbers, underscores or hyphens.',
                );
            toast.success('Tags saved');
            onTagsSaved(node.id, nextTags);
            setEditor(null);
        } catch (error) {
            toast.error((error as Error).message);
        } finally {
            setSaving(false);
        }
    }
    function trash() {
        router.delete(`/workspaces/${workspaceId}/nodes/${node.id}`, {
            onSuccess: onClose,
            onError: reportErrors,
        });
    }
    return (
        <section
            aria-label={`Actions for ${node.title}`}
            className="border-t border-border/70 bg-background/80 p-4"
        >
            <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                        {node.title}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                        {node.type}
                    </p>
                </div>
                <button
                    type="button"
                    aria-label="Close actions"
                    onClick={onClose}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
                >
                    <X size={16} />
                </button>
            </div>
            {createType ? (
                <CreateNodeForm
                    workspaceId={workspaceId}
                    parentId={node.id}
                    type={createType}
                    onCancel={() => setCreateType(null)}
                    onCreated={onDismiss}
                />
            ) : editor === 'rename' ? (
                <form onSubmit={rename} className="space-y-3">
                    <label
                        htmlFor="navigator-rename"
                        className="text-xs text-muted-foreground"
                    >
                        Name
                    </label>
                    <input
                        id="navigator-rename"
                        autoFocus
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        maxLength={255}
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setEditor(null)}
                            className="rounded-lg px-3 py-2 text-sm hover:bg-accent"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={!title.trim() || saving}
                            className="rounded-lg bg-foreground px-4 py-2 text-sm text-background disabled:opacity-40"
                        >
                            Save
                        </button>
                    </div>
                </form>
            ) : editor === 'tags' ? (
                <form
                    onSubmit={(event) => void saveTags(event)}
                    className="space-y-3"
                >
                    <label
                        htmlFor="navigator-tags"
                        className="text-xs text-muted-foreground"
                    >
                        Tags, separated by commas
                    </label>
                    <input
                        id="navigator-tags"
                        autoFocus
                        value={tags}
                        onChange={(event) => setTags(event.target.value)}
                        placeholder="e.g. work, reference"
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setEditor(null)}
                            className="rounded-lg px-3 py-2 text-sm hover:bg-accent"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={saving}
                            className="rounded-lg bg-foreground px-4 py-2 text-sm text-background disabled:opacity-40"
                        >
                            Save tags
                        </button>
                    </div>
                </form>
            ) : editor === 'trash' ? (
                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        Move “{node.title}” to Trash?
                    </p>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setEditor(null)}
                            className="rounded-lg px-3 py-2 text-sm hover:bg-accent"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={trash}
                            className="rounded-lg bg-destructive px-4 py-2 text-sm text-white"
                        >
                            Move to Trash
                        </button>
                    </div>
                </div>
            ) : editor === 'move' ? (
                <div className="space-y-3">
                    <label
                        htmlFor="navigator-move"
                        className="text-xs text-muted-foreground"
                    >
                        Move to
                    </label>
                    <select
                        id="navigator-move"
                        defaultValue=""
                        onChange={(event) => {
                            onMove(
                                node.id,
                                event.target.value === 'root'
                                    ? null
                                    : Number(event.target.value),
                                0,
                            );
                            onClose();
                        }}
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                    >
                        <option value="" disabled>
                            Choose a location
                        </option>
                        <option value="root">Workspace root</option>
                        {nodes
                            .filter(
                                (candidate) =>
                                    candidate.id !== node.id &&
                                    (candidate.type === 'folder' ||
                                        (candidate.type === 'database' &&
                                            node.type === 'document')),
                            )
                            .map((candidate) => (
                                <option key={candidate.id} value={candidate.id}>
                                    {candidate.title}
                                </option>
                            ))}
                    </select>
                    <button
                        onClick={() => setEditor(null)}
                        className="text-sm text-muted-foreground hover:text-foreground"
                    >
                        Cancel
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-1">
                    <button
                        className={actionClass}
                        onClick={() => {
                            onOpen(orbitRevealUrl(workspaceId, node, nodes));
                            onDismiss();
                        }}
                    >
                        <Orbit size={15} /> Reveal in Orbit
                    </button>
                    <button
                        className={actionClass}
                        onClick={() => {
                            onOpen(nodeUrl(workspaceId, node), true);
                            onDismiss();
                        }}
                    >
                        <ArrowUpRight size={15} /> New tab
                    </button>
                    <button
                        className={actionClass}
                        onClick={() => setEditor('rename')}
                    >
                        <Pencil size={15} /> Rename
                    </button>
                    <button
                        className={actionClass}
                        onClick={() => setEditor('move')}
                    >
                        <ArrowUpRight size={15} /> Move
                    </button>
                    <button
                        className={actionClass}
                        onClick={() => setEditor('tags')}
                    >
                        <Tags size={15} /> Tags
                    </button>
                    {node.type !== 'document' && (
                        <button
                            className={actionClass}
                            onClick={() => setCreateType('document')}
                        >
                            <FilePlus2 size={15} /> Document
                        </button>
                    )}
                    {node.type === 'folder' && (
                        <>
                            <button
                                className={actionClass}
                                onClick={() => setCreateType('folder')}
                            >
                                <FolderPlus size={15} /> Folder
                            </button>
                            <button
                                className={actionClass}
                                onClick={() => setCreateType('database')}
                            >
                                <Database size={15} /> Database
                            </button>
                        </>
                    )}
                    <button
                        className={`${actionClass} text-destructive hover:text-destructive`}
                        onClick={() => setEditor('trash')}
                    >
                        <Trash2 size={15} /> Trash
                    </button>
                </div>
            )}
        </section>
    );
}
