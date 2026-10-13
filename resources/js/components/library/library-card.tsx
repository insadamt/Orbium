import * as Menu from '@radix-ui/react-dropdown-menu';
import {
    Check,
    Download,
    FileArchive,
    FileText,
    File,
    MoreHorizontal,
    Pencil,
    ScanEye,
    Trash2,
    CheckSquare,
} from 'lucide-react';
import { useRef, useState } from 'react';
import {
    isLibraryImage,
    libraryFileLabel,
    type LibraryFile,
} from './library-api';

type Props = {
    file: LibraryFile;
    selecting: boolean;
    selected: boolean;
    picker?: boolean;
    disabled?: boolean;
    onOpen: () => void;
    onSelect: () => void;
    onRename: (trigger: HTMLElement | null) => void;
    onDelete: (trigger: HTMLElement | null) => void;
};

export function LibraryCard({
    file,
    selecting,
    selected,
    picker,
    disabled,
    onOpen,
    onSelect,
    onRename,
    onDelete,
}: Props) {
    const menuButton = useRef<HTMLButtonElement>(null);
    const [failed, setFailed] = useState(false);
    const image = isLibraryImage(file);
    const label = libraryFileLabel(file);
    const FileIcon =
        label === 'PDF' || file.mime_type.startsWith('text/')
            ? FileText
            : /zip|compressed|archive/.test(file.mime_type)
              ? FileArchive
              : File;
    const open = selecting || picker ? onSelect : onOpen;
    return (
        <article
            className="library-card"
            data-selected={selected}
            data-selecting={selecting}
        >
            <div className="library-card-media">
                <button
                    type="button"
                    className="library-card-open"
                    disabled={disabled || (picker && !file.available)}
                    onClick={open}
                    aria-label={`${selecting || picker ? 'Select' : 'View details for'} ${file.name}`}
                    aria-pressed={selecting || picker ? selected : undefined}
                >
                    {image && file.available && !failed ? (
                        <img
                            src={file.thumbnail_url}
                            alt={file.name}
                            width={file.width ?? undefined}
                            height={file.height ?? undefined}
                            loading="lazy"
                            decoding="async"
                            onError={() => setFailed(true)}
                        />
                    ) : (
                        <div className="library-file-art">
                            <FileIcon size={46} strokeWidth={1.2} />
                            <span>
                                {!file.available || failed
                                    ? 'Preview unavailable'
                                    : label}
                            </span>
                        </div>
                    )}
                </button>
                {(selecting || picker) && (
                    <button
                        type="button"
                        className="library-card-select"
                        aria-label={`${selected ? 'Deselect' : 'Select'} ${file.name}`}
                        aria-pressed={selected}
                        onClick={onSelect}
                        disabled={disabled || (picker && !file.available)}
                    >
                        <Check size={15} aria-hidden="true" />
                    </button>
                )}
                {!picker && (
                    <Menu.Root>
                        <Menu.Trigger asChild>
                            <button
                                type="button"
                                ref={menuButton}
                                className="library-card-menu"
                                aria-label={`Actions for ${file.name}`}
                                disabled={disabled}
                            >
                                <MoreHorizontal size={19} />
                            </button>
                        </Menu.Trigger>
                        <Menu.Portal>
                            <Menu.Content
                                align="end"
                                sideOffset={6}
                                className="library-menu"
                            >
                                <Menu.Item
                                    className="library-menu-item"
                                    onSelect={onOpen}
                                >
                                    <ScanEye size={15} /> View details
                                </Menu.Item>
                                <Menu.Item
                                    className="library-menu-item"
                                    disabled={!file.available}
                                    asChild
                                >
                                    <a href={`${file.url}?download=1`}>
                                        <Download size={15} /> Download
                                    </a>
                                </Menu.Item>
                                <Menu.Item
                                    className="library-menu-item"
                                    onSelect={() =>
                                        onRename(menuButton.current)
                                    }
                                >
                                    <Pencil size={15} /> Rename
                                </Menu.Item>
                                <Menu.Item
                                    className="library-menu-item"
                                    onSelect={onSelect}
                                >
                                    <CheckSquare size={15} />{' '}
                                    {selected ? 'Deselect' : 'Select'}
                                </Menu.Item>
                                <Menu.Separator className="my-1 border-t border-border/50" />
                                <Menu.Item
                                    className="library-menu-item text-destructive"
                                    onSelect={() =>
                                        onDelete(menuButton.current)
                                    }
                                >
                                    <Trash2 size={15} /> Delete…
                                </Menu.Item>
                            </Menu.Content>
                        </Menu.Portal>
                    </Menu.Root>
                )}
            </div>
            <button
                type="button"
                className="library-card-name"
                title={file.name}
                disabled={disabled || (picker && !file.available)}
                onClick={open}
            >
                {file.name}
            </button>
        </article>
    );
}
