import * as Menu from '@radix-ui/react-dropdown-menu';
import { Info, Loader2, MoreHorizontal, RotateCcw, Trash2 } from 'lucide-react';
import { useRef } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { TrashEntryAvatar } from './trash-entry-avatar';
import type { TrashEntry } from './trash-types';

type Props = {
    entry: TrashEntry;
    selected: boolean;
    busy: boolean;
    restoring: boolean;
    onSelect: () => void;
    onDetails: (trigger: HTMLElement) => void;
    onRestore: () => void;
    onDelete: () => void;
};

export function TrashEntryRow({
    entry,
    selected,
    busy,
    restoring,
    onSelect,
    onDetails,
    onRestore,
    onDelete,
}: Props) {
    const menuTrigger = useRef<HTMLButtonElement>(null);
    const openingPanel = useRef(false);
    const deletedDate = new Date(entry.deleted_at);
    return (
        <li
            className="workspace-manager-row trash-entry-row"
            data-selected={selected}
        >
            <div className="workspace-manager-row-surface trash-entry-surface">
                <Checkbox
                    checked={selected}
                    disabled={busy}
                    onCheckedChange={onSelect}
                    aria-label={`Select ${entry.title}`}
                />
                <button
                    type="button"
                    className="trash-entry-identity"
                    disabled={busy}
                    onClick={(event) => onDetails(event.currentTarget)}
                    aria-label={`Details for ${entry.title}`}
                >
                    <TrashEntryAvatar type={entry.type} title={entry.title} />
                    <span className="workspace-manager-identity">
                        <strong>{entry.title}</strong>
                        <small title={entry.path}>
                            {entry.path}
                            {entry.descendant_count > 0
                                ? ` · ${entry.descendant_count} items`
                                : ''}
                        </small>
                    </span>
                </button>
                <time
                    className="trash-entry-date"
                    dateTime={entry.deleted_at}
                    title={deletedDate.toLocaleString()}
                >
                    {deletedDate.toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year:
                            deletedDate.getFullYear() ===
                            new Date().getFullYear()
                                ? undefined
                                : 'numeric',
                    })}
                </time>
                <button
                    type="button"
                    disabled={busy}
                    onClick={onRestore}
                    className="workspace-manager-restore trash-entry-restore"
                    aria-label={`Restore ${entry.title}`}
                    title="Restore"
                >
                    {restoring ? (
                        <Loader2 size={15} className="trash-spinner" />
                    ) : (
                        <RotateCcw size={15} />
                    )}
                    <span>{restoring ? 'Restoring…' : 'Restore'}</span>
                </button>
                <Menu.Root modal={false}>
                    <Menu.Trigger
                        ref={menuTrigger}
                        disabled={busy}
                        className="workspace-manager-overflow trash-overflow"
                        aria-label={`Actions for ${entry.title}`}
                    >
                        <MoreHorizontal size={19} />
                    </Menu.Trigger>
                    <Menu.Portal>
                        <Menu.Content
                            className="floating-menu workspace-manager-menu"
                            align="end"
                            sideOffset={8}
                            onCloseAutoFocus={(event) => {
                                if (openingPanel.current) {
                                    event.preventDefault();
                                    openingPanel.current = false;
                                }
                            }}
                        >
                            <Menu.Item
                                className="floating-menu-item"
                                onSelect={() => {
                                    openingPanel.current = true;
                                    if (menuTrigger.current)
                                        onDetails(menuTrigger.current);
                                }}
                            >
                                <Info size={15} />
                                Details
                            </Menu.Item>
                            <Menu.Separator className="my-1 border-t border-border/50" />
                            <Menu.Item
                                className="floating-menu-item text-destructive"
                                onSelect={() => {
                                    openingPanel.current = true;
                                    onDelete();
                                }}
                            >
                                <Trash2 size={15} />
                                Delete permanently
                            </Menu.Item>
                        </Menu.Content>
                    </Menu.Portal>
                </Menu.Root>
            </div>
        </li>
    );
}
