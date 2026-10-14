import { getStrictContext } from '@/lib/get-strict-context';
export type DropdownMenuContextType = {
    isOpen: boolean;
    setIsOpen: (o: boolean) => void;
    highlightedValue: string | null;
    setHighlightedValue: (value: string | null) => void;
};

export type DropdownMenuSubContextType = {
    isOpen: boolean;
    setIsOpen: (o: boolean) => void;
};

export const [DropdownMenuProvider, useDropdownMenu] =
    getStrictContext<DropdownMenuContextType>('DropdownMenuContext');

export const [DropdownMenuSubProvider, useDropdownMenuSub] =
    getStrictContext<DropdownMenuSubContextType>('DropdownMenuSubContext');
