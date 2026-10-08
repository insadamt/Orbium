import type { OrbiumMetadata } from '../dialect/metadata';

export function applyMarkdownDividerAppearance(
    divider: HTMLElement,
    metadata: OrbiumMetadata,
) {
    if (
        metadata.dividerColor === undefined &&
        metadata.dividerThickness === undefined &&
        metadata.dividerStyle === undefined
    )
        return;
    divider.dataset.customDivider = 'true';
    if (metadata.dividerColor)
        divider.style.setProperty('--divider-color', metadata.dividerColor);
    if (metadata.dividerThickness)
        divider.style.setProperty(
            '--divider-thickness',
            `${metadata.dividerThickness}px`,
        );
    if (metadata.dividerStyle)
        divider.style.setProperty('--divider-style', metadata.dividerStyle);
}
