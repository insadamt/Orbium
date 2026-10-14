import { useState } from 'react';
import type { TreeNode } from '@/components/navigation/navigation-types';
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/navigation/navigation-dialog';
import { AppSelect } from '@/components/ui/app-select';

type Props = {
    nodes: TreeNode[];
    selectedNodes: TreeNode[];
    parentId: number | null;
    busy: boolean;
    onClear: () => void;
    onSubmit: (
        action: 'move' | 'trash',
        parentId?: number | null,
        position?: number,
        onSuccess?: () => void,
    ) => void;
};

export function ExplorerBulkActions({
    nodes,
    selectedNodes,
    parentId,
    busy,
    onClear,
    onSubmit,
}: Props) {
    const [action, setAction] = useState<'move' | 'trash' | null>(null);
    const [destination, setDestination] = useState('root');
    const selectedIds = new Set(selectedNodes.map((node) => node.id));
    function isValidDestination(node: TreeNode) {
        if (
            node.type === 'document' ||
            (node.type === 'database' &&
                selectedNodes.some((item) => item.type !== 'document'))
        )
            return false;
        let ancestor: TreeNode | undefined = node;
        const visited = new Set<number>();
        while (ancestor) {
            if (selectedIds.has(ancestor.id) || visited.has(ancestor.id))
                return false;
            visited.add(ancestor.id);
            ancestor = nodes.find((item) => item.id === ancestor?.parent_id);
        }
        return node.id !== parentId;
    }
    function destinationLabel(node: TreeNode) {
        const path = [node.title];
        let ancestor = nodes.find((item) => item.id === node.parent_id);
        const visited = new Set([node.id]);
        while (ancestor && !visited.has(ancestor.id)) {
            visited.add(ancestor.id);
            path.unshift(ancestor.title);
            ancestor = nodes.find((item) => item.id === ancestor?.parent_id);
        }
        return path.join(' / ');
    }
    if (selectedNodes.length === 0) return null;
    const options = [
        ...(parentId === null
            ? []
            : [{ value: 'root', label: 'Workspace root' }]),
        ...nodes.filter(isValidDestination).map((node) => ({
            value: String(node.id),
            label: destinationLabel(node),
        })),
    ];
    return (
        <>
            <div
                className="fixed bottom-6 left-1/2 z-40 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-3 rounded-xl border border-border bg-popover px-4 py-3 text-sm shadow-xl"
                role="toolbar"
                aria-label="Selected item actions"
            >
                <span role="status">{selectedNodes.length} selected</span>
                <button
                    type="button"
                    disabled={busy || options.length === 0}
                    onClick={() => {
                        setDestination(options[0]?.value ?? 'root');
                        setAction('move');
                    }}
                >
                    Move
                </button>
                <button
                    type="button"
                    disabled={busy}
                    className="text-destructive"
                    onClick={() => setAction('trash')}
                >
                    Delete
                </button>
                <button type="button" disabled={busy} onClick={onClear}>
                    Clear selection
                </button>
            </div>
            <Dialog
                open={action !== null}
                onOpenChange={(open) => {
                    if (!open && !busy) setAction(null);
                }}
            >
                <DialogContent>
                    <DialogTitle>
                        {action === 'move' ? 'Move' : 'Delete'}{' '}
                        {selectedNodes.length} selected items?
                    </DialogTitle>
                    {action === 'move' ? (
                        <AppSelect
                            value={destination}
                            onValueChange={setDestination}
                            options={options}
                            label="Destination"
                            disabled={busy}
                        />
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            Selected items and their contents will go to Trash
                            and can be restored.
                        </p>
                    )}
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            disabled={busy}
                            className="rounded-lg px-4 py-2 text-sm hover:bg-accent"
                            onClick={() => setAction(null)}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={busy}
                            className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
                            onClick={() => {
                                if (action)
                                    onSubmit(
                                        action,
                                        destination === 'root'
                                            ? null
                                            : Number(destination),
                                        undefined,
                                        () => setAction(null),
                                    );
                            }}
                        >
                            {busy
                                ? 'Working…'
                                : action === 'move'
                                  ? 'Move items'
                                  : 'Move to Trash'}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
