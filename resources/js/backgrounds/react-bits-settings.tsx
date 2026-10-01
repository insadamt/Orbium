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
    const friendlyNames: Record<string, string> = {
        dpr: 'Resolution',
        maxDpr: 'Maximum resolution',
        targetFps: 'Frame rate',
        iterationsPoisson: 'Fluid smoothness',
        iterationsViscous: 'Fluid detail',
        dt: 'Simulation step',
        fov: 'Field of view',
        mouseInteraction: 'Pointer interaction',
        mouseStrength: 'Pointer strength',
    };
    if (friendlyNames[key]) return friendlyNames[key];
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
                                className="appearance-color-input"
                            />
                        </label>
                    ))}
                </div>
            </fieldset>
        );
    }
    if (typeof value === 'boolean') {
        return (
            <label className="flex items-center gap-2.5 text-sm">
                <input
                    type="checkbox"
                    checked={value}
                    onChange={(event) => onChange(event.target.checked)}
                    className="appearance-checkbox"
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
            <label className="grid gap-2 text-sm">
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
                    className="appearance-range"
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
                    className="appearance-select"
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
                        className="appearance-color-input"
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
                className="appearance-select"
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
    const entries = Object.entries(settings);
    const color = entries.find(
        ([key, value]) =>
            key.toLowerCase().includes('color') &&
            typeof value === 'string' &&
            value.startsWith('#'),
    );
    const basicKeys = new Set(
        [color?.[0], 'speed', 'brightness', 'intensity'].filter(Boolean),
    );
    const basicEntries = entries.filter(([key]) => basicKeys.has(key));
    const advancedEntries = entries.filter(([key]) => !basicKeys.has(key));
    const renderControl = ([settingKey, value]: [string, EffectValue]) => (
        <SettingControl
            key={settingKey}
            settingKey={settingKey}
            value={value}
            defaultValue={effect.defaults[settingKey]}
            choices={effect.choices?.[settingKey]}
            onChange={(nextValue) => onChange({ [settingKey]: nextValue })}
        />
    );
    return (
        <div className="appearance-control-panel space-y-5 rounded-2xl p-5">
            <div className="flex items-center justify-between gap-3">
                <h3 className="font-medium">{effect.title} controls</h3>
                <button
                    type="button"
                    onClick={onReset}
                    className="appearance-text-button"
                >
                    Reset
                </button>
            </div>
            {basicEntries.length > 0 && (
                <div className="grid gap-4">
                    {basicEntries.map(renderControl)}
                </div>
            )}
            <Collapsible.Root>
                <Collapsible.Trigger className="appearance-disclosure flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring [&[data-state=open]>svg]:rotate-180">
                    Customize all settings
                    <ChevronDown
                        aria-hidden="true"
                        size={16}
                        className="transition-transform"
                    />
                </Collapsible.Trigger>
                <Collapsible.Content className="pt-4">
                    <div className="grid gap-4">
                        {advancedEntries.map(renderControl)}
                    </div>
                </Collapsible.Content>
            </Collapsible.Root>
        </div>
    );
}
import * as Collapsible from '@radix-ui/react-collapsible';
import { ChevronDown } from 'lucide-react';
