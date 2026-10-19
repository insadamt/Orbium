import type { ComponentProps } from 'react';
import type { LucideIcon } from 'lucide-react';

export function BoardToolButton({
    label,
    icon: Icon,
    children,
    ...props
}: ComponentProps<'button'> & { label: string; icon: LucideIcon }) {
    return (
        <button
            type="button"
            className="board-tool-button"
            title={label}
            aria-label={label}
            {...props}
        >
            <Icon size={17} aria-hidden="true" />
            {children}
        </button>
    );
}
