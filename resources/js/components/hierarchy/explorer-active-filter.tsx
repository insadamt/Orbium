// Makes a restored type/favorites filter visible and removable without clearing search.
// Depends on Motion presence and the shared toolbar surface/tooltip styles.
import {
    AnimatePresence,
    motion,
    useIsPresent,
    useReducedMotion,
} from 'motion/react';
import { forwardRef } from 'react';
import { X } from 'lucide-react';
import { ControlTooltip } from '@/components/navigation/control-tooltip';
import { explorerTypeOptions } from './use-explorer-filters';

type FilterProps = { value: string; disabled: boolean; onClear: () => void };

const ActiveFilterSurface = forwardRef<HTMLButtonElement, FilterProps>(
    function ActiveFilterSurface({ value, disabled, onClear }, ref) {
        const isPresent = useIsPresent();
        const reducedMotion = useReducedMotion();
        const label =
            explorerTypeOptions.find((option) => option.value === value)
                ?.label ?? value;
        return (
            <ControlTooltip label={`Remove ${label} filter`}>
                <motion.button
                    ref={ref}
                    type="button"
                    className="explorer-active-filter floating-surface"
                    disabled={disabled || !isPresent}
                    inert={!isPresent}
                    onClick={onClear}
                    aria-label={`Remove ${label} filter`}
                    initial={
                        reducedMotion ? false : { opacity: 0, scale: 0.96 }
                    }
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: reducedMotion ? 1 : 0.96 }}
                    transition={{ duration: reducedMotion ? 0 : 0.16 }}
                >
                    <span>{label}</span>
                    <X size={13} aria-hidden="true" />
                </motion.button>
            </ControlTooltip>
        );
    },
);

export function ExplorerActiveFilter(props: FilterProps) {
    return (
        <AnimatePresence mode="popLayout">
            {props.value !== 'all' && (
                <ActiveFilterSurface key={props.value} {...props} />
            )}
        </AnimatePresence>
    );
}
