const diagramPalette: Record<string, string> = {
    '#f4f4f5': 'var(--mermaid-node, #f4f4f5)',
    '#27272a': 'var(--mermaid-text, #27272a)',
    '#a1a1aa': 'var(--mermaid-stroke, #a1a1aa)',
    '#e4e4e7': 'var(--mermaid-secondary, #e4e4e7)',
    '#fafafa': 'var(--mermaid-group, #fafafa)',
    '#d4d4d8': 'var(--mermaid-border, #d4d4d8)',
    '#71717a': 'var(--mermaid-line, #71717a)',
    '#c4c4cc': 'var(--mermaid-chart, #c4c4cc)',
    '#ffffff': 'var(--mermaid-surface, #ffffff)',
};

type DiagramColor = { channels: number[]; opacity: number };

function readDiagramColor(value: string): DiagramColor | undefined {
    const color = value.toLowerCase();
    if (color === 'black') return { channels: [0, 0, 0], opacity: 1 };
    if (color === 'white') return { channels: [255, 255, 255], opacity: 1 };
    const hex = /^#([a-f\d]{3}|[a-f\d]{6})$/i.exec(color)?.[1];
    if (hex) {
        const expanded =
            hex.length === 3
                ? hex
                      .split('')
                      .map((digit) => digit + digit)
                      .join('')
                : hex;
        return {
            channels: [0, 2, 4].map((offset) =>
                Number.parseInt(expanded.slice(offset, offset + 2), 16),
            ),
            opacity: 1,
        };
    }
    const rgb =
        /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i.exec(
            color,
        );
    if (!rgb) return;
    return {
        channels: rgb.slice(1, 4).map(Number),
        opacity: rgb[4] === undefined ? 1 : Number(rgb[4]),
    };
}

function adaptDiagramColor(value: string): string {
    const color = readDiagramColor(value);
    if (!color) return value;
    const hex =
        '#' +
        color.channels
            .map((channel) => Math.round(channel).toString(16).padStart(2, '0'))
            .join('');
    let replacement: string | undefined = diagramPalette[hex];
    if (
        !replacement &&
        Math.max(...color.channels) - Math.min(...color.channels) <= 12
    ) {
        const brightness =
            color.channels.reduce((sum, channel) => sum + channel, 0) / 3;
        // Mermaid derives extra neutral shades for table rows, labels and chart regions.
        replacement =
            brightness < 100
                ? diagramPalette['#27272a']
                : brightness > 235
                  ? diagramPalette['#fafafa']
                  : brightness > 190
                    ? diagramPalette['#e4e4e7']
                    : undefined;
    }
    if (!replacement) return value;
    return color.opacity === 1
        ? replacement
        : `color-mix(in srgb, ${replacement} ${color.opacity * 100}%, transparent)`;
}

function adaptDiagramStyles(styles: string): string {
    return styles.replace(
        /((?:fill|stroke|color|background(?:-color)?)\s*:\s*)([^;}]+)/gi,
        (_declaration, property: string, value: string) =>
            property +
            value.replace(
                /#[a-f\d]{6}\b|#[a-f\d]{3}\b|rgba?\([^)]*\)|\b(?:black|white)\b/gi,
                adaptDiagramColor,
            ),
    );
}

export function applyMermaidPreviewColors(svg: string): string {
    return svg
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, adaptDiagramStyles)
        .replace(/\bstyle="[^"]*"/gi, adaptDiagramStyles)
        .replace(
            /(\b(?:fill|stroke)=")([^"]+)(")/gi,
            (_attribute, prefix: string, value: string, suffix: string) =>
                prefix + adaptDiagramColor(value) + suffix,
        );
}
