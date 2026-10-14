import type { TooltipView } from '@codemirror/view';

export function mountCompletionMenuReveal(tooltip: TooltipView) {
    const menu = tooltip.dom;
    const previousPositioned = tooltip.positioned?.bind(tooltip);
    const revealAfterPositioning: NonNullable<TooltipView['positioned']> = (
        space,
    ) => {
        previousPositioned?.(space);
        menu.dataset.completionReveal = 'ready';
    };
    tooltip.positioned = revealAfterPositioning;
    // A tooltip may have completed its first measurement before the adapter mounts.
    if (menu.style.top && menu.style.top !== '-10000px') {
        menu.dataset.completionReveal = 'ready';
    }
    return () => {
        if (tooltip.positioned === revealAfterPositioning) {
            tooltip.positioned = previousPositioned;
        }
        delete menu.dataset.completionReveal;
    };
}
