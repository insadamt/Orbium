import type {
    EffectDefinition,
    EffectSettings,
    EffectValue,
} from './react-bits-catalog';

const integerKeys = new Set([
    'threadCount',
    'cableCount',
    'streakCount',
    'iterationsViscous',
    'iterationsPoisson',
    'iterations',
    'targetFps',
    'rayCount',
    'lanesPerRoad',
    'lightPairsPerRoadWay',
    'totalSideLightSticks',
]);

const signedKeys = new Set([
    'tilt',
    'centerX',
    'centerY',
    'offsetX',
    'offsetY',
    'hueShift',
    'rotation',
    'pillarRotation',
    'blendAngle',
    'colorBalance',
    'layerOffset',
    'warpSpeed',
]);

function numericBounds(
    key: string,
    value: number,
): { min: number; max: number; step: number } {
    if (key === 'targetFps') return { min: 15, max: 60, step: 1 };
    if (key === 'fov') return { min: 30, max: 150, step: 1 };
    if (key === 'autoResumeDelay') return { min: 0, max: 5000, step: 50 };
    if (key === 'rotationAmount') return { min: 0, max: 1000, step: 10 };
    if (key === 'cursorSize') return { min: 10, max: 300, step: 1 };
    if (key === 'dt') return { min: 0.001, max: 0.05, step: 0.001 };
    if (key === 'resolution' || key === 'renderScale')
        return { min: 0.25, max: 1, step: 0.05 };
    if (key === 'dpr' || key === 'maxDpr')
        return { min: 0.5, max: 2, step: 0.1 };
    if (key === 'hueShift') return { min: -360, max: 360, step: 1 };
    if (signedKeys.has(key)) {
        const extent = Math.max(2, Math.abs(value) * 3);
        return { min: -extent, max: extent, step: 0.01 };
    }
    if (integerKeys.has(key))
        return { min: 1, max: Math.max(10, value * 2), step: 1 };
    if (
        /opacity|blend|strength|influence|dampening|softness|grainAmount/i.test(
            key,
        )
    ) {
        if (/opacity$/i.test(key)) return { min: 0, max: 1, step: 0.01 };
        return { min: 0, max: Math.max(1, value * 2), step: 0.01 };
    }
    const max = Math.max(2, value * 3);
    return { min: 0, max, step: max > 100 ? 1 : max > 20 ? 0.1 : 0.01 };
}

function settingLabel(key: string): string {
    return key
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/^./, (letter) => letter.toUpperCase());
}

function SettingControl({
    settingKey,
    value,
    defaultValue,
    choices,
    onChange,
}: {
    settingKey: string;
    value: EffectValue;
    defaultValue: EffectValue;
    choices?: string[];
    onChange: (value: EffectValue) => void;
}) {
    const label = settingLabel(settingKey);

    if (Array.isArray(value)) {
        return (
            <fieldset className="space-y-2">
                <legend className="text-sm">{label}</legend>
                <div className="flex flex-wrap gap-3">
                    {value.map((color, index) => (
                        <label
                            key={index}
                            className="flex items-center gap-2 text-xs text-muted-foreground"
                        >
                            {index + 1}
                            <input
                                type="color"
                                value={color}
                                aria-label={`${label} ${index + 1}`}
                                onChange={(event) =>
                                    onChange(
                                        value.map((item, itemIndex) =>
                                            itemIndex === index
                                                ? event.target.value
                                                : item,
                                        ),
                                    )
                                }
                                className="h-9 w-12 cursor-pointer rounded border border-border bg-transparent"
                            />
                        </label>
                    ))}
                </div>
            </fieldset>
        );
    }
    if (typeof value === 'boolean') {
        return (
            <label className="flex items-center gap-2 text-sm">
                <input
                    type="checkbox"
                    checked={value}
                    onChange={(event) => onChange(event.target.checked)}
                />
                {label}
            </label>
        );
    }
    if (typeof value === 'number') {
        const { min, max, step } = numericBounds(
            settingKey,
            Number(defaultValue),
        );
        return (
            <label className="grid gap-1.5 text-sm">
                <span className="flex justify-between gap-3">
                    <span>{label}</span>
                    <output className="text-muted-foreground tabular-nums">
                        {value}
                    </output>
                </span>
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(event) => onChange(Number(event.target.value))}
                    className="w-full accent-foreground"
                />
            </label>
        );
    }
    if (choices) {
        return (
            <label className="grid gap-1.5 text-sm">
                {label}
                <select
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className="rounded-lg border border-border bg-background p-2"
                >
                    {choices.map((choice) => (
                        <option key={choice} value={choice}>
                            {settingLabel(choice)}
                        </option>
                    ))}
                </select>
            </label>
        );
    }
    if (value.startsWith('#')) {
        return (
            <label className="flex items-center justify-between gap-3 text-sm">
                {label}
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
    return (
        <label className="grid gap-1.5 text-sm">
            {label}
            <input
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="rounded-lg border border-border bg-background p-2"
            />
        </label>
    );
}

export function ReactBitsSettings({
    effect,
    settings,
    onChange,
    onReset,
}: {
    effect: EffectDefinition;
    settings: EffectSettings;
    onChange: (values: EffectSettings) => void;
    onReset: () => void;
}) {
    return (
        <div className="space-y-5 rounded-xl border border-border bg-background/75 p-5">
            <div className="flex items-center justify-between gap-3">
                <h3 className="font-medium">{effect.title} controls</h3>
                <button
                    type="button"
                    onClick={onReset}
                    className="text-sm underline underline-offset-4"
                >
                    Reset
                </button>
            </div>
            <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
                {Object.entries(settings).map(([settingKey, value]) => (
                    <SettingControl
                        key={settingKey}
                        settingKey={settingKey}
                        value={value}
                        defaultValue={effect.defaults[settingKey]}
                        choices={effect.choices?.[settingKey]}
                        onChange={(nextValue) =>
                            onChange({ [settingKey]: nextValue })
                        }
                    />
                ))}
            </div>
        </div>
    );
}
