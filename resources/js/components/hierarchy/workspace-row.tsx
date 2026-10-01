import { Link } from '@inertiajs/react';
import * as Menu from '@radix-ui/react-dropdown-menu';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useRef, type FormEvent } from 'react';
import type { WorkspaceSummary } from './workspace-panel';

type Props = {
    workspace: WorkspaceSummary;
    editing: boolean;
    editedName: string;
    trashConfirmationOpen: boolean;
    processing: boolean;
    onEditedNameChange: (name: string) => void;
    onRenameSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onRename: () => void;
    onCancelRename: () => void;
    onRequestTrash: () => void;
    onCancelTrash: () => void;
    onConfirmTrash: () => void;
};

export function WorkspaceRow({
    workspace,
    editing,
    editedName,
    trashConfirmationOpen,
    processing,
    onEditedNameChange,
    onRenameSubmit,
    onRename,
    onCancelRename,
    onRequestTrash,
    onCancelTrash,
    onConfirmTrash,
}: Props) {
    const renamingFromMenu = useRef(false);
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: workspace.id,
        disabled: editing || trashConfirmationOpen || processing,
    });

    return (
        <div
            ref={setNodeRef}
            className="workspace-manager-row"
            data-dragging={isDragging}
            style={{ transform: CSS.Transform.toString(transform), transition }}
        >
            <div className="workspace-manager-row-surface">
                <button
                    ref={setActivatorNodeRef}
                    type="button"
                    className="workspace-drag-handle"
                    aria-label={`Reorder ${workspace.name}`}
                    title="Drag to reorder"
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical size={17} aria-hidden="true" />
                </button>
                {editing ? (
                    <form
                        className="workspace-rename-form"
                        onSubmit={onRenameSubmit}
                        onKeyDown={(event) => {
                            if (event.key === 'Escape') onCancelRename();
                        }}
                    >
                        <input
                            autoFocus
                            aria-label={`New name for ${workspace.name}`}
                            value={editedName}
                            onChange={(event) =>
                                onEditedNameChange(event.target.value)
                            }
                            maxLength={255}
                        />
                        <button
                            type="submit"
                            disabled={processing || !editedName.trim()}
                        >
                            Save
                        </button>
                        <button type="button" onClick={onCancelRename}>
                            Cancel
                        </button>
                    </form>
                ) : (
                    <Link
                        href={`/workspaces/${workspace.id}`}
                        className="workspace-manager-row-link"
                        aria-label={`Open ${workspace.name}`}
                    >
                        <span
                            className="workspace-manager-avatar"
                            aria-hidden="true"
                        >
                            {workspace.name.slice(0, 1).toLocaleUpperCase()}
                        </span>
                        <span className="workspace-manager-identity">
                            <strong>{workspace.name}</strong>
                            <small>Workspace</small>
                        </span>
                    </Link>
                )}
                <Menu.Root modal={false}>
                    <Menu.Trigger
                        className="workspace-manager-overflow"
                        aria-label={`Actions for ${workspace.name}`}
                        title="Workspace actions"
                    >
                        <MoreHorizontal size={19} aria-hidden="true" />
                    </Menu.Trigger>
                    <Menu.Portal>
                        <Menu.Content
                            className="floating-menu workspace-manager-menu"
                            align="end"
                            sideOffset={8}
                            onCloseAutoFocus={(event) => {
                                if (renamingFromMenu.current) {
                                    event.preventDefault();
                                    renamingFromMenu.current = false;
                                }
                            }}
                        >
                            <Menu.Item
                                className="floating-menu-item"
                                onSelect={() => {
                                    renamingFromMenu.current = true;
                                    onRename();
                                }}
                            >
                                <Pencil size={15} aria-hidden="true" /> Rename
                            </Menu.Item>
                            <Menu.Separator className="my-1 border-t border-border/50" />
                            <Menu.Item
                                className="floating-menu-item text-destructive"
                                onSelect={onRequestTrash}
                            >
                                <Trash2 size={15} aria-hidden="true" /> Move to
                                Trash
                            </Menu.Item>
                        </Menu.Content>
                    </Menu.Portal>
                </Menu.Root>
            </div>
            {trashConfirmationOpen && (
                <div className="workspace-trash-confirmation">
                    <span>
                        Move “{workspace.name}” to Trash? You can restore it
                        later.
                    </span>
                    <div>
                        <button type="button" onClick={onCancelTrash}>
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={processing}
                            onClick={onConfirmTrash}
                        >
                            Move to Trash
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
