import * as DialogPrimitive from '@radix-ui/react-dialog';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export const Dialog = DialogPrimitive.Root;
export const DialogTitle = DialogPrimitive.Title;
export function DialogContent({
    children,
    className,
    ...props
}: ComponentProps<typeof DialogPrimitive.Content>) {
    return (
        <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className="orbium-dialog-overlay fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" />
            <DialogPrimitive.Content
                aria-describedby={undefined}
                className={cn(
                    'orbium-dialog-content fixed top-[15%] left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 flex-col gap-3 rounded-xl border border-border bg-background/95 p-5 shadow-xl',
                    className,
                )}
                {...props}
            >
                {children}
                <DialogPrimitive.Close
                    className="absolute top-3 right-3 rounded p-1 text-xs"
                    aria-label="Close panel"
                >
                    ✕
                </DialogPrimitive.Close>
            </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
    );
}
