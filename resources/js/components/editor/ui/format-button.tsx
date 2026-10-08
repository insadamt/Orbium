import type { ReactNode } from 'react';

export function FormatButton({
    label,
    active,
    onClick,
    children,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            aria-pressed={active}
            onMouseDown={(event) => event.preventDefault()}
            onClick={onClick}
            className={`rounded p-2 ${active ? 'bg-accent' : 'hover:bg-accent'}`}
        >
            {children}
        </button>
    );
}
