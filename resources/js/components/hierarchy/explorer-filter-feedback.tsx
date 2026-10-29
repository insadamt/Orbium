// Animates the Reveal notice beside controls without holding space during dismissal.
// Depends on Motion presence, the shared surface/tooltip, and dismissal callback.
import { ScanEye, X } from 'lucide-react';
import {
    AnimatePresence,
    motion,
    useIsPresent,
    useReducedMotion,
} from 'motion/react';
import { forwardRef } from 'react';
import { ControlTooltip } from '@/components/navigation/control-tooltip';

type FeedbackProps = {
    onDismissReveal: () => void;
    disabled: boolean;
};

const RevealNotice = forwardRef<HTMLDivElement, FeedbackProps>(
    function RevealNotice({ onDismissReveal, disabled }, ref) {
        const isPresent = useIsPresent();
        const reducedMotion = useReducedMotion();
        return (
            <motion.div
                ref={ref}
                className="explorer-filter-feedback floating-surface"
                inert={!isPresent}
                initial={reducedMotion ? false : { opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: reducedMotion ? 1 : 0.98 }}
                transition={{ duration: reducedMotion ? 0 : 0.16 }}
            >
                <ScanEye size={16} aria-hidden="true" />
                <span>Revealed outside filters</span>
                <ControlTooltip label="Return to filters">
                    <button
                        type="button"
                        disabled={disabled || !isPresent}
                        aria-label="Return to filters"
                        onClick={onDismissReveal}
                    >
                        <X size={15} aria-hidden="true" />
                    </button>
                </ControlTooltip>
            </motion.div>
        );
    },
);

export function ExplorerFilterFeedback({
    revealedOutsideFilters,
    ...props
}: FeedbackProps & { revealedOutsideFilters: boolean }) {
    return (
        <AnimatePresence mode="popLayout">
            {revealedOutsideFilters && (
                <RevealNotice key="reveal-notice" {...props} />
            )}
        </AnimatePresence>
    );
}
