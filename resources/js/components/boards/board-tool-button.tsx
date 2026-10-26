import type { ComponentProps } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

export function BoardToolButton({
    label,
    icon: Icon,
    children,
    shortcut,
    tooltipSide = 'top',
    tooltipClassName = '',
    disabledReason,
    ...props
}: ComponentProps<'button'> & {
    label: string;
    icon?: LucideIcon;
    shortcut?: string;
    tooltipSide?: 'top' | 'right' | 'bottom' | 'left';
    tooltipClassName?: string;
    disabledReason?: string;
}) {
    return (
        <Tooltip delayDuration={350}>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    className="board-tool-button editor-toolbar-button"
                    aria-label={label}
                    {...props}
                >
                    {Icon && <Icon size={17} aria-hidden="true" />}
                    {children}
                </button>
            </TooltipTrigger>
            <TooltipContent
                side={tooltipSide}
                sideOffset={10}
                collisionPadding={12}
                className={`board-tool-tooltip ${tooltipClassName}`}
            >
                <span>{label}</span>
                {shortcut && <kbd>{shortcut}</kbd>}
                {props.disabled && disabledReason && (
                    <small>{disabledReason}</small>
                )}
            </TooltipContent>
        </Tooltip>
    );
}
