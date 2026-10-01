import * as Collapsible from '@radix-ui/react-collapsible';
import * as Menu from '@radix-ui/react-dropdown-menu';
import { ChevronDown, MoreHorizontal, RotateCcw, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import type { TrashedWorkspace } from './workspace-panel';

type Props = {
    workspaces: TrashedWorkspace[];
    processing: boolean;
    onRestore: (workspaceId: number) => void;
    onDelete: (workspace: TrashedWorkspace) => void;
};

export function TrashedWorkspaces({
    workspaces,
    processing,
    onRestore,
    onDelete,
}: Props) {
    const [open, setOpen] = useState(false);
    const openingDeleteDialog = useRef<number | null>(null);

    return (
        <Collapsible.Root
            open={open}
            onOpenChange={setOpen}
            className="workspace-manager-trash"
        >
            <Collapsible.Trigger className="workspace-manager-trash-trigger">
                <span>Trash</span>
                <span className="workspace-manager-trash-count">
                    {workspaces.length}
                </span>
                <ChevronDown
                    size={17}
                    className="workspace-manager-trash-chevron"
                    aria-hidden="true"
                />
            </Collapsible.Trigger>
            <Collapsible.Content className="workspace-manager-trash-content">
                <div className="workspace-manager-trash-inner">
                    {workspaces.length === 0 && (
                        <p className="workspace-manager-empty">
                            Trash is empty.
                        </p>
                    )}
                    {workspaces.map((workspace) => (
                        <div
                            key={workspace.id}
                            className="workspace-manager-row workspace-manager-trashed-row"
                        >
                            <div className="workspace-manager-row-surface">
                                <span
                                    className="workspace-manager-avatar"
                                    aria-hidden="true"
                                >
                                    {workspace.name
                                        .slice(0, 1)
                                        .toLocaleUpperCase()}
                                </span>
                                <span className="workspace-manager-identity">
                                    <strong>{workspace.name}</strong>
                                    <small>Workspace in Trash</small>
                                </span>
                                <button
                                    type="button"
                                    disabled={processing}
                                    onClick={() => onRestore(workspace.id)}
                                    className="workspace-manager-restore"
                                >
                                    <RotateCcw size={14} aria-hidden="true" />{' '}
                                    Restore
                                </button>
                                <Menu.Root modal={false}>
                                    <Menu.Trigger
                                        className="workspace-manager-overflow workspace-manager-overflow-visible"
                                        aria-label={`Actions for trashed ${workspace.name}`}
                                        title="Trash actions"
                                    >
                                        <MoreHorizontal
                                            size={19}
                                            aria-hidden="true"
                                        />
                                    </Menu.Trigger>
                                    <Menu.Portal>
                                        <Menu.Content
                                            className="floating-menu workspace-manager-menu"
                                            align="end"
                                            sideOffset={8}
                                            onCloseAutoFocus={(event) => {
                                                if (
                                                    openingDeleteDialog.current ===
                                                    workspace.id
                                                ) {
                                                    event.preventDefault();
                                                    openingDeleteDialog.current =
                                                        null;
                                                }
                                            }}
                                        >
                                            <Menu.Item
                                                className="floating-menu-item text-destructive"
                                                onSelect={() => {
                                                    openingDeleteDialog.current =
                                                        workspace.id;
                                                    onDelete(workspace);
                                                }}
                                            >
                                                <Trash2
                                                    size={15}
                                                    aria-hidden="true"
                                                />{' '}
                                                Delete permanently
                                            </Menu.Item>
                                        </Menu.Content>
                                    </Menu.Portal>
                                </Menu.Root>
                            </div>
                        </div>
                    ))}
                </div>
            </Collapsible.Content>
        </Collapsible.Root>
    );
}
