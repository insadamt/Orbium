import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

type Props = {
    open: boolean;
    onClose: () => void;
    title: string;
    description: string;
    children: ReactNode;
};

export default function DatabaseDialog({
    open,
    onClose,
    title,
    description,
    children,
}: Props) {
    return (
        <Dialog.Root
            open={open}
            onOpenChange={(next) => {
                if (!next) onClose();
            }}
        >
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[3px]" />
                <Dialog.Content className="db-dialog fixed top-1/2 left-1/2 z-50 flex max-h-[85vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-popover text-foreground shadow-2xl">
                    <div className="relative px-6 pt-6 pb-4">
                        <Dialog.Title className="pr-8 text-lg font-semibold tracking-tight">
                            {title}
                        </Dialog.Title>
                        <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                            {description}
                        </Dialog.Description>
                        <Dialog.Close asChild>
                            <button
                                type="button"
                                aria-label="Close dialog"
                                className="db-icon-button absolute top-5 right-5"
                            >
                                <X size={17} />
                            </button>
                        </Dialog.Close>
                    </div>
                    {children}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
