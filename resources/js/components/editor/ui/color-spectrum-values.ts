export type SpectrumColor = {
    hue: number;
    saturation: number;
    brightness: number;
};

export function resolveColorHex(color?: string) {
    if (color?.startsWith('preset:')) {
        const preset = getComputedStyle(document.documentElement)
            .getPropertyValue(`--editor-text-color-${color.slice(7)}`)
            .trim();
        if (/^#[0-9a-f]{6}$/i.test(preset)) return preset;
    }
    return color && /^#[0-9a-f]{6}$/i.test(color) ? color : '#75a1ff';
}

export function hexToSpectrum(hex: string): SpectrumColor {
    const [red, green, blue] = [1, 3, 5].map(
        (offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255,
    );
    const maximum = Math.max(red, green, blue);
    const minimum = Math.min(red, green, blue);
    const difference = maximum - minimum;
    let hue = 0;
    if (difference) {
        if (maximum === red) hue = ((green - blue) / difference) % 6;
        else if (maximum === green) hue = (blue - red) / difference + 2;
        else hue = (red - green) / difference + 4;
    }
    return {
        hue: (hue * 60 + 360) % 360,
        saturation: maximum ? difference / maximum : 0,
        brightness: maximum,
    };
}

export function spectrumToHex({ hue, saturation, brightness }: SpectrumColor) {
    const channel = (offset: number) => {
        const step = (offset + hue / 60) % 6;
        const value =
            brightness *
            (1 - saturation * Math.max(0, Math.min(step, 4 - step, 1)));
        return Math.round(value * 255)
            .toString(16)
            .padStart(2, '0');
    };
    return `#${channel(5)}${channel(3)}${channel(1)}`;
}
