import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export function NativeCheckbox({ className, readOnly, onClick, ...props }: Omit<ComponentProps<'input'>, 'type'>) {
    return (
        <span className={cn('orbium-animated-checkbox', className)}>
            <input
                {...props}
                type="checkbox"
                readOnly={readOnly}
                onClick={(event) => {
                    if (readOnly) event.preventDefault();
                    onClick?.(event);
                }}
            />
            <svg className="orbium-checkbox-indicator" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4.5 12.75l6 6 9-13.5" />
            </svg>
        </span>
    );
}
