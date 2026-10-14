import { Download, Pencil, ScanEye, Trash2 } from 'lucide-react';
import { PositionedMenu } from '@/components/ui/positioned-menu';
import * as Menu from '@/components/ui/dropdown-menu';
import type { LibraryFile } from './library-api';

export type LibraryMenuPosition = {
    file: LibraryFile;
    x: number;
    y: number;
    returnFocusTo: HTMLElement | null;
};

export function LibraryContextMenu({
    position,
    onClose,
    onOpen,
    onRename,
    onDelete,
}: {
    position: LibraryMenuPosition;
    onClose: () => void;
    onOpen: () => void;
    onRename: () => void;
    onDelete: () => void;
}) {
    return (
        <PositionedMenu
            position={position}
            label={`Actions for ${position.file.name}`}
            onClose={onClose}
            returnFocusTo={position.returnFocusTo}
        >
            <Menu.Item onSelect={onOpen}>
                <ScanEye size={16} /> View details
            </Menu.Item>
            <Menu.Item disabled={!position.file.available} asChild>
                <a
                    href={
                        position.file.available
                            ? `${position.file.url}?download=1`
                            : undefined
                    }
                >
                    <Download size={16} /> Download
                </a>
            </Menu.Item>
            <Menu.Item onSelect={onRename}>
                <Pencil size={16} /> Rename
            </Menu.Item>
            <Menu.Separator />
            <Menu.Item variant="destructive" onSelect={onDelete}>
                <Trash2 size={16} /> Delete…
            </Menu.Item>
        </PositionedMenu>
    );
}
