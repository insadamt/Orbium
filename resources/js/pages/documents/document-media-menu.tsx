import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Ellipsis, ImagePlus, Trash2 } from 'lucide-react';

type Props = {
    hasIcon: boolean;
    hasCover: boolean;
    iconUploading: boolean;
    coverUploading: boolean;
    onChooseIcon: () => void;
    onRemoveIcon: () => void;
    onChooseCover: () => void;
    onRemoveCover: () => void;
};

const itemClass =
    'flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm outline-none focus:bg-accent data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50';

export default function DocumentMediaMenu({
    hasIcon,
    hasCover,
    iconUploading,
    coverUploading,
    onChooseIcon,
    onRemoveIcon,
    onChooseCover,
    onRemoveCover,
}: Props) {
    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button
                    type="button"
                    aria-label="Document image options"
                    title="Document image options"
                    className="glass-surface inline-flex size-9 items-center justify-center rounded-lg border border-border text-foreground shadow-sm hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
                >
                    <Ellipsis size={19} aria-hidden="true" />
                </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    align="end"
                    sideOffset={6}
                    className="glass-surface z-50 w-48 rounded-xl border border-border p-1.5 text-foreground shadow-xl"
                >
                    <DropdownMenu.Label className="px-2.5 py-1 text-xs text-muted-foreground">
                        Document images
                    </DropdownMenu.Label>
                    <DropdownMenu.Item
                        disabled={iconUploading}
                        onSelect={onChooseIcon}
                        className={itemClass}
                    >
                        <ImagePlus size={15} aria-hidden="true" />
                        {iconUploading
                            ? 'Uploading icon…'
                            : hasIcon
                              ? 'Change icon'
                              : 'Add icon'}
                    </DropdownMenu.Item>
                    {hasIcon && (
                        <DropdownMenu.Item
                            disabled={iconUploading}
                            onSelect={onRemoveIcon}
                            className={itemClass}
                        >
                            <Trash2 size={15} aria-hidden="true" /> Remove icon
                        </DropdownMenu.Item>
                    )}
                    <DropdownMenu.Separator className="my-1 h-px bg-border" />
                    <DropdownMenu.Item
                        disabled={coverUploading}
                        onSelect={onChooseCover}
                        className={itemClass}
                    >
                        <ImagePlus size={15} aria-hidden="true" />
                        {coverUploading
                            ? 'Uploading cover…'
                            : hasCover
                              ? 'Change cover'
                              : 'Add cover'}
                    </DropdownMenu.Item>
                    {hasCover && (
                        <DropdownMenu.Item
                            disabled={coverUploading}
                            onSelect={onRemoveCover}
                            className={itemClass}
                        >
                            <Trash2 size={15} aria-hidden="true" /> Remove cover
                        </DropdownMenu.Item>
                    )}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}
