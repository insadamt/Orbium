// Gives repeated shell/explorer controls the same tooltip timing and placement.
// Depends on the app Tooltip provider; the child retains its existing interaction.
import type { ReactElement } from 'react';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

export function ControlTooltip({
    label,
    children,
}: {
    label: string;
    children: ReactElement;
}) {
    return (
        <Tooltip delayDuration={350}>
            <TooltipTrigger asChild>{children}</TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8}>
                {label}
            </TooltipContent>
        </Tooltip>
    );
}
