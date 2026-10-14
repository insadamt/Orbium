import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

function Checkbox({ className, ...props }: ComponentProps<typeof CheckboxPrimitive.Root>) {
    return (
        <CheckboxPrimitive.Root
            data-slot="checkbox"
            className={cn('peer orbium-animated-checkbox aria-invalid:border-destructive outline-none', className)}
            {...props}
        >
            <CheckboxPrimitive.Indicator forceMount asChild>
                <svg data-slot="checkbox-indicator" className="orbium-checkbox-indicator" viewBox="0 0 24 24" aria-hidden="true">
                    <path className="orbium-checkbox-check" d="M4.5 12.75l6 6 9-13.5" />
                    <path className="orbium-checkbox-mixed" d="M5 12h14" />
                </svg>
            </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
    );
}

export { Checkbox };
