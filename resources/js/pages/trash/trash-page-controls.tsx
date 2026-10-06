import * as Menu from '@radix-ui/react-dropdown-menu';
import {
    Check,
    MoreHorizontal,
    SlidersHorizontal,
    Trash2,
    X,
} from 'lucide-react';
import { useRef } from 'react';
import { AppSelect } from '@/components/ui/app-select';

type Props = {
    workspaceId: string;
    workspaces: { id: number; name: string; trashed: boolean }[];
    type: string;
    sort: string;
    busy: boolean;
    canEmpty: boolean;
    onWorkspaceChange: (value: string) => void;
    onTypeChange: (value: string) => void;
    onSortChange: (value: string) => void;
    onEmpty: () => void;
};

export function TrashPageControls({
    workspaceId,
    workspaces,
    type,
    sort,
    busy,
    canEmpty,
    onWorkspaceChange,
    onTypeChange,
    onSortChange,
    onEmpty,
}: Props) {
    const openingConfirmation = useRef(false);
    const filtered = Boolean(type) || sort !== 'newest';
    return (
        <div className="trash-page-controls">
            <AppSelect
                label="Trash scope"
                value={workspaceId}
                clearLabel="All workspaces"
                placeholder="All workspaces"
                disabled={busy}
                className="trash-scope-select"
                onValueChange={onWorkspaceChange}
                options={workspaces.map((workspace) => ({
                    value: String(workspace.id),
                    label: `${workspace.name}${workspace.trashed ? ' (in Trash)' : ''}`,
                }))}
            />
            <Menu.Root modal={false}>
                <Menu.Trigger
                    disabled={busy}
                    className="trash-control-button"
                    data-active={filtered}
                    aria-label="Filter and sort Trash"
                >
                    <SlidersHorizontal size={16} />
                    <span>Filter</span>
                    {filtered && <span className="trash-filter-dot" />}
                </Menu.Trigger>
                <Menu.Portal>
                    <Menu.Content
                        className="floating-menu trash-filter-menu"
                        align="end"
                        sideOffset={8}
                    >
                        <Menu.Label className="trash-menu-label">
                            Show
                        </Menu.Label>
                        <Menu.RadioGroup
                            value={type || 'all'}
                            onValueChange={(value) =>
                                onTypeChange(value === 'all' ? '' : value)
                            }
                        >
                            {[
                                ['all', 'All types'],
                                ['workspace', 'Workspaces'],
                                ['folder', 'Folders'],
                                ['database', 'Databases'],
                                ['document', 'Documents'],
                            ].map(([value, label]) => (
                                <Menu.RadioItem
                                    key={value}
                                    value={value}
                                    className="floating-menu-item trash-radio-item"
                                    onSelect={(event) => event.preventDefault()}
                                >
                                    <Menu.ItemIndicator>
                                        <Check size={14} />
                                    </Menu.ItemIndicator>
                                    {label}
                                </Menu.RadioItem>
                            ))}
                        </Menu.RadioGroup>
                        <Menu.Separator className="my-2 border-t border-border/50" />
                        <Menu.Label className="trash-menu-label">
                            Sort by
                        </Menu.Label>
                        <Menu.RadioGroup
                            value={sort}
                            onValueChange={onSortChange}
                        >
                            {[
                                ['newest', 'Recently deleted'],
                                ['oldest', 'Oldest first'],
                                ['title', 'Title A–Z'],
                            ].map(([value, label]) => (
                                <Menu.RadioItem
                                    key={value}
                                    value={value}
                                    className="floating-menu-item trash-radio-item"
                                    onSelect={(event) => event.preventDefault()}
                                >
                                    <Menu.ItemIndicator>
                                        <Check size={14} />
                                    </Menu.ItemIndicator>
                                    {label}
                                </Menu.RadioItem>
                            ))}
                        </Menu.RadioGroup>
                        {filtered && (
                            <>
                                <Menu.Separator className="my-2 border-t border-border/50" />
                                <Menu.Item
                                    className="floating-menu-item"
                                    onSelect={() => {
                                        onTypeChange('');
                                        onSortChange('newest');
                                    }}
                                >
                                    <X size={14} />
                                    Reset filters
                                </Menu.Item>
                            </>
                        )}
                    </Menu.Content>
                </Menu.Portal>
            </Menu.Root>
            <Menu.Root modal={false}>
                <Menu.Trigger
                    disabled={busy}
                    className="trash-control-button trash-icon-button"
                    aria-label="Trash page actions"
                >
                    <MoreHorizontal size={19} />
                </Menu.Trigger>
                <Menu.Portal>
                    <Menu.Content
                        className="floating-menu workspace-manager-menu trash-page-action-menu"
                        align="end"
                        sideOffset={8}
                        onCloseAutoFocus={(event) => {
                            if (openingConfirmation.current) {
                                event.preventDefault();
                                openingConfirmation.current = false;
                            }
                        }}
                    >
                        <Menu.Item
                            disabled={!canEmpty}
                            className="floating-menu-item text-destructive"
                            onSelect={() => {
                                openingConfirmation.current = true;
                                onEmpty();
                            }}
                        >
                            <Trash2 size={15} />
                            Empty{' '}
                            {workspaceId ? 'workspace Trash' : 'all Trash'}
                        </Menu.Item>
                    </Menu.Content>
                </Menu.Portal>
            </Menu.Root>
        </div>
    );
}
