// Keeps the Reveal exception beside the controls while matching cards stay visible.
// Depends on the shared floating surface, tooltip provider, and dismissal callback.
import { ScanEye, X } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

export function ExplorerFilterFeedback({
    revealedOutsideFilters,
    onDismissReveal,
    disabled,
}: {
    revealedOutsideFilters: boolean;
    onDismissReveal: () => void;
    disabled: boolean;
}) {
    if (!revealedOutsideFilters) return null;
    return (
        <div className="explorer-filter-feedback floating-surface">
            <ScanEye size={16} aria-hidden="true" />
            <span>Revealed outside filters</span>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        disabled={disabled}
                        aria-label="Return to filters"
                        onClick={onDismissReveal}
                    >
                        <X size={15} aria-hidden="true" />
                    </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Return to filters</TooltipContent>
            </Tooltip>
        </div>
    );
}
