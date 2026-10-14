import { useState } from 'react';
import { LibraryPicker } from '@/components/library/library-picker';
import type { LibraryFile } from '@/components/library/library-api';
import * as DropdownMenu from '@/components/ui/dropdown-menu';
import { ImagePlus, Pencil, RotateCcw } from 'lucide-react';

type PageMediaEditButtonProps = {
    workspaceId?: number;
    onChooseLibrary?: (file: LibraryFile) => void;
    entityLabel: string;
    kind: 'icon' | 'cover';
    hasCustomImage: boolean;
    uploading: boolean;
    onChooseImage: () => void;
    onResetImage: () => void;
};

const itemClass =
    'flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm outline-none data-[highlighted]:bg-accent data-[disabled]:opacity-50';

export function PageMediaEditButton({
    workspaceId,
    onChooseLibrary,
    entityLabel,
    kind,
    hasCustomImage,
    uploading,
    onChooseImage,
    onResetImage,
}: PageMediaEditButtonProps) {
    const [libraryOpen, setLibraryOpen] = useState(false);
    return (
        <>
            {libraryOpen && workspaceId && onChooseLibrary && (
                <LibraryPicker
                    workspaceId={workspaceId}
                    imagesOnly
                    onClose={() => setLibraryOpen(false)}
                    onChoose={(file) => {
                        setLibraryOpen(false);
                        onChooseLibrary(file);
                    }}
                />
            )}
            <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                    <button
                        type="button"
                        className="page-media-edit-button glass-surface"
                        aria-label={`Edit ${entityLabel.toLowerCase()} ${kind}`}
                        disabled={uploading}
                        data-uploading={uploading}
                    >
                        <Pencil size={12} aria-hidden="true" />
                        {uploading ? 'Saving…' : 'Edit'}
                    </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content
                    align="end"
                    sideOffset={6}
                    className="glass-surface z-50 min-w-44 rounded-xl border border-border p-1.5 text-foreground shadow-xl"
                >
                    <DropdownMenu.Item
                        onSelect={onChooseImage}
                        className={itemClass}
                    >
                        <ImagePlus size={15} aria-hidden="true" />
                        Change {kind}
                    </DropdownMenu.Item>
                    {workspaceId && onChooseLibrary && (
                        <DropdownMenu.Item
                            onSelect={() => setLibraryOpen(true)}
                            className={itemClass}
                        >
                            Choose from Library
                        </DropdownMenu.Item>
                    )}
                    {hasCustomImage && (
                        <DropdownMenu.Item
                            onSelect={onResetImage}
                            className={itemClass}
                        >
                            <RotateCcw size={15} aria-hidden="true" />
                            Reset to default
                        </DropdownMenu.Item>
                    )}
                </DropdownMenu.Content>
            </DropdownMenu.Root>
        </>
    );
}
