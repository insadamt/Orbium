// Exposes existing node creation flows from the explorer toolbar.
import * as Menu from '@/components/ui/dropdown-menu';
import type { TreeNode } from '@/components/navigation/navigation-types';
import {
    ChevronDown,
    Database,
    FilePlus,
    FolderPlus,
    PanelsTopLeft,
    Plus,
    type LucideIcon,
} from 'lucide-react';

const createOptions: {
    type: TreeNode['type'];
    label: string;
    Icon: LucideIcon;
}[] = [
    { type: 'document', label: 'New document', Icon: FilePlus },
    { type: 'folder', label: 'New folder', Icon: FolderPlus },
    { type: 'database', label: 'New database', Icon: Database },
    { type: 'board', label: 'New Board', Icon: PanelsTopLeft },
];

export function ExplorerCreateMenu({
    disabled,
    onCreate,
}: {
    disabled: boolean;
    onCreate: (type: TreeNode['type']) => void;
}) {
    return (
        <Menu.Root>
            <Menu.Trigger
                type="button"
                className="explorer-create-trigger floating-surface"
                aria-label="Create a new item in this location"
                disabled={disabled}
            >
                <Plus size={17} aria-hidden="true" />
                <span>New</span>
                <ChevronDown
                    size={14}
                    className="explorer-create-chevron"
                    aria-hidden="true"
                />
            </Menu.Trigger>
            <Menu.Content
                className="floating-menu"
                align="start"
                sideOffset={8}
                collisionPadding={8}
            >
                {createOptions.map(({ type, label, Icon }) => (
                    <Menu.Item
                        key={type}
                        className="floating-menu-item"
                        onSelect={() => onCreate(type)}
                    >
                        <Icon size={16} aria-hidden="true" />
                        {label}
                    </Menu.Item>
                ))}
            </Menu.Content>
        </Menu.Root>
    );
}
