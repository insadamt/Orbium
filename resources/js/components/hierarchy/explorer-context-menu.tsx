import {
    Database,
    FilePlus,
    FolderPlus,
    Upload,
    ArrowUpRight,
    ExternalLink,
    Pencil,
    Download,
    Trash2,
    type LucideIcon,
} from 'lucide-react';
import { PositionedMenu } from '@/components/ui/positioned-menu';
import * as Menu from '@/components/ui/dropdown-menu';

export type ExplorerMenuPosition = {
    nodeId: number | null;
    x: number;
    y: number;
    direction: 'ltr' | 'rtl';
};

type MenuAction = {
    label: string;
    run: () => void;
    destructive?: boolean;
    icon: LucideIcon;
};

export function ExplorerContextMenu({
    position,
    nodeTitle,
    onClose,
    onCreate,
    onOpen,
    onRename,
    onDelete,
    onImport,
    onExport,
}: {
    position: ExplorerMenuPosition | null;
    nodeTitle?: string;
    onClose: () => void;
    onCreate: (type: 'document' | 'folder' | 'database') => void;
    onOpen: (newTab: boolean) => void;
    onRename: () => void;
    onDelete: () => void;
    onImport: () => void;
    onExport?: () => void;
}) {
    if (!position) return null;
    const actions: MenuAction[] =
        position.nodeId === null
            ? [
                  {
                      icon: FilePlus,
                      label: 'New document',
                      run: () => onCreate('document'),
                  },
                  {
                      icon: FolderPlus,
                      label: 'New folder',
                      run: () => onCreate('folder'),
                  },
                  {
                      icon: Database,
                      label: 'New database',
                      run: () => onCreate('database'),
                  },
                  { icon: Upload, label: 'Import…', run: onImport },
              ]
            : [
                  {
                      icon: ArrowUpRight,
                      label: 'Open',
                      run: () => onOpen(false),
                  },
                  {
                      icon: ExternalLink,
                      label: 'Open in new tab',
                      run: () => onOpen(true),
                  },
                  { icon: Pencil, label: 'Rename', run: onRename },
                  ...(onExport
                      ? [{ icon: Download, label: 'Export…', run: onExport }]
                      : []),
                  {
                      icon: Trash2,
                      label: 'Delete',
                      run: onDelete,
                      destructive: true,
                  },
              ];
    return (
        <PositionedMenu
            position={position}
            label={
                nodeTitle ? `Actions for ${nodeTitle}` : 'Create in this folder'
            }
            onClose={onClose}
        >
            {actions.map(({ icon: Icon, ...action }) => (
                <Menu.Item
                    key={action.label}
                    variant={action.destructive ? 'destructive' : 'default'}
                    onSelect={() => {
                        onClose();
                        action.run();
                    }}
                >
                    <Icon size={16} /> {action.label}
                </Menu.Item>
            ))}
        </PositionedMenu>
    );
}
