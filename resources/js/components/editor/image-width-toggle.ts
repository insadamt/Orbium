type ImageWidthState = {
    width: number;
    availableWidth: number;
    previousWidth?: number;
};

export function imageWidthTogglePresentation({
    width,
    availableWidth,
    previousWidth,
}: ImageWidthState) {
    const expanded = availableWidth > 0 && width >= availableWidth - 0.5;
    const canRestore =
        previousWidth !== undefined && previousWidth < availableWidth - 0.5;
    return {
        expanded,
        label: expanded
            ? canRestore
                ? 'Restore image size'
                : 'Reduce image size'
            : 'Fill available width',
    };
}

export function nextImageToggleWidth(state: ImageWidthState) {
    const maximum = Math.max(1, Math.round(state.availableWidth));
    if (!imageWidthTogglePresentation(state).expanded)
        return {
            width: maximum,
            previousWidth: Math.min(state.width, maximum),
        };
    const fallback = Math.max(1, Math.round(maximum * 0.6));
    const restored =
        state.previousWidth !== undefined && state.previousWidth < maximum - 0.5
            ? state.previousWidth
            : fallback;
    return {
        width: Math.round(
            Math.max(Math.min(120, maximum), Math.min(restored, maximum - 1)),
        ),
        previousWidth: state.previousWidth,
    };
}
