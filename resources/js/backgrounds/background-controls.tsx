import type { GhostSettings, MoltenSettings } from './background-preferences';

type NumericKey<T> = {
    [K in keyof T]: T[K] extends number ? K : never;
}[keyof T];
type Control<T> = {
    key: NumericKey<T>;
    label: string;
    min: number;
    max: number;
    step: number;
};

export const ghostControls: Control<GhostSettings>[] = [
    { key: 'speed', label: 'Speed', min: 0, max: 2, step: 0.01 },
    { key: 'scale', label: 'Scale', min: 0.5, max: 5, step: 0.05 },
    { key: 'rotation', label: 'Rotation', min: -3.14, max: 3.14, step: 0.01 },
    {
        key: 'rotationSpeed',
        label: 'Rotation speed',
        min: -2,
        max: 2,
        step: 0.01,
    },
    { key: 'layers', label: 'Layers', min: 1, max: 10, step: 1 },
    {
        key: 'waveAmplitude',
        label: 'Wave amplitude',
        min: 0,
        max: 0.1,
        step: 0.001,
    },
    {
        key: 'waveFrequency',
        label: 'Wave frequency',
        min: 0,
        max: 12,
        step: 0.1,
    },
    { key: 'waveSpeed', label: 'Wave speed', min: -2, max: 2, step: 0.01 },
    { key: 'layerSpeed', label: 'Layer speed', min: -1, max: 1, step: 0.01 },
    { key: 'twist', label: 'Twist', min: -1, max: 1, step: 0.01 },
    {
        key: 'twistFrequency',
        label: 'Twist frequency',
        min: 0,
        max: 15,
        step: 0.1,
    },
    { key: 'twistSpeed', label: 'Twist speed', min: -3, max: 3, step: 0.05 },
    {
        key: 'lineFrequency',
        label: 'Line frequency',
        min: 0.5,
        max: 15,
        step: 0.1,
    },
    { key: 'lineSpacing', label: 'Line spacing', min: 0.5, max: 6, step: 0.05 },
    { key: 'lineSharpness', label: 'Line sharpness', min: 1, max: 40, step: 1 },
    { key: 'glowFalloff', label: 'Glow falloff', min: 1, max: 30, step: 0.5 },
    {
        key: 'glowIntensity',
        label: 'Glow intensity',
        min: 0,
        max: 4,
        step: 0.05,
    },
    { key: 'brightness', label: 'Brightness', min: 0, max: 4, step: 0.05 },
    { key: 'blueBoost', label: 'Blue boost', min: 0, max: 3, step: 0.05 },
    { key: 'vignette', label: 'Vignette', min: 0, max: 2, step: 0.05 },
    { key: 'grain', label: 'Grain', min: 0, max: 0.3, step: 0.005 },
    { key: 'dpr', label: 'Resolution', min: 0.5, max: 2, step: 0.1 },
    { key: 'fps', label: 'Frame rate', min: 15, max: 60, step: 5 },
];

export const moltenControls: Control<MoltenSettings>[] = [
    { key: 'speed', label: 'Speed', min: 0, max: 2, step: 0.01 },
    { key: 'scale', label: 'Scale', min: 1, max: 8, step: 0.1 },
    { key: 'detail', label: 'Detail', min: 1, max: 8, step: 1 },
    { key: 'glow', label: 'Glow', min: 0, max: 4, step: 0.05 },
    { key: 'coreSize', label: 'Core size', min: 0.001, max: 0.5, step: 0.001 },
    { key: 'swirl', label: 'Swirl', min: -3, max: 3, step: 0.05 },
    { key: 'fold', label: 'Fold', min: -1, max: 1, step: 0.01 },
    { key: 'blackPoint', label: 'Black point', min: 0, max: 1, step: 0.01 },
    { key: 'brightness', label: 'Brightness', min: 0, max: 4, step: 0.05 },
    {
        key: 'grainIntensity',
        label: 'Grain intensity',
        min: 0,
        max: 0.3,
        step: 0.005,
    },
    {
        key: 'mouseStrength',
        label: 'Pointer strength',
        min: 0,
        max: 2,
        step: 0.05,
    },
    { key: 'opacity', label: 'Opacity', min: 0, max: 1, step: 0.01 },
];

export function NumberControls<T extends object>({
    controls,
    values,
    onChange,
}: {
    controls: Control<T>[];
    values: T;
    onChange: (key: NumericKey<T>, value: number) => void;
}) {
    return (
        <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
            {controls.map(({ key, label, min, max, step }) => (
                <label key={String(key)} className="grid gap-1.5 text-sm">
                    <span className="flex justify-between gap-3">
                        <span>{label}</span>
                        <output className="text-muted-foreground tabular-nums">
                            {String(values[key])}
                        </output>
                    </span>
                    <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={Number(values[key])}
                        onChange={(event) =>
                            onChange(key, Number(event.target.value))
                        }
                        className="w-full accent-foreground"
                    />
                </label>
            ))}
        </div>
    );
}

export function ColorControl({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <label className="flex items-center justify-between gap-3 text-sm">
            <span>{label}</span>
            <span className="flex items-center gap-2 text-muted-foreground">
                {value}
                <input
                    type="color"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className="h-9 w-12 cursor-pointer rounded border border-border bg-transparent"
                />
            </span>
        </label>
    );
}
