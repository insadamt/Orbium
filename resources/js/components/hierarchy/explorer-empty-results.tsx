// Animates the centered empty state without delaying live explorer filtering.
// Depends on Motion presence, shared floating surfaces, and the reset callback.
import { RotateCcw, SearchX } from 'lucide-react';
import {
    AnimatePresence,
    motion,
    useIsPresent,
    useReducedMotion,
} from 'motion/react';
import { forwardRef } from 'react';

type EmptyResultsProps = {
    onClearFilters: () => void;
    disabled: boolean;
};

const EmptyResultsSurface = forwardRef<HTMLDivElement, EmptyResultsProps>(
    function EmptyResultsSurface({ onClearFilters, disabled }, ref) {
        const isPresent = useIsPresent();
        const reducedMotion = useReducedMotion();
        return (
            <motion.div
                ref={ref}
                className="explorer-empty-results"
                inert={!isPresent}
                initial={
                    reducedMotion ? false : { opacity: 0, y: 12, scale: 0.98 }
                }
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{
                    opacity: 0,
                    y: reducedMotion ? 0 : -8,
                    scale: reducedMotion ? 1 : 0.98,
                }}
                transition={{
                    duration: reducedMotion ? 0 : isPresent ? 0.24 : 0.18,
                    ease: [0.22, 1, 0.36, 1],
                }}
            >
                <div className="explorer-empty-symbol floating-surface">
                    <SearchX size={36} strokeWidth={1.3} aria-hidden="true" />
                </div>
                <h2>No matching pages</h2>
                <p>
                    Try a different search or clear your filters to see all
                    pages here.
                </p>
                <button
                    type="button"
                    className="explorer-empty-action floating-surface"
                    disabled={disabled || !isPresent}
                    onClick={onClearFilters}
                >
                    <RotateCcw size={16} aria-hidden="true" />
                    Clear search and filters
                </button>
            </motion.div>
        );
    },
);

export function ExplorerEmptyResults({
    visible,
    ...props
}: EmptyResultsProps & { visible: boolean }) {
    // Popping the exit out of layout lets cards return without reserving blank space.
    return (
        <AnimatePresence mode="popLayout">
            {visible && <EmptyResultsSurface key="empty-results" {...props} />}
        </AnimatePresence>
    );
}
