import { firstEffects } from './react-bits-catalog-first';
import { secondEffects } from './react-bits-catalog-second';

export type EffectValue = string | number | boolean | string[];
export type EffectSettings = Record<string, EffectValue>;
export type EffectDefinition = {
    kind: string;
    title: string;
    description: string;
    defaults: EffectSettings;
    choices?: Record<string, string[]>;
};

export const reactBitsEffects: EffectDefinition[] = [
    ...firstEffects,
    ...secondEffects,
];

export function findReactBitsEffect(
    kind: string,
): EffectDefinition | undefined {
    return reactBitsEffects.find((effect) => effect.kind === kind);
}

export function defaultReactBitsSettings(): Record<string, EffectSettings> {
    return Object.fromEntries(
        reactBitsEffects.map(({ kind, defaults }) => [kind, { ...defaults }]),
    );
}

function isValidSetting(
    value: unknown,
    fallback: EffectValue,
    choices?: string[],
): value is EffectValue {
    if (Array.isArray(fallback)) {
        return (
            Array.isArray(value) &&
            value.length === fallback.length &&
            value.every(
                (color) =>
                    typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color),
            )
        );
    }
    if (typeof fallback === 'number')
        return typeof value === 'number' && Number.isFinite(value);
    if (typeof fallback === 'boolean') return typeof value === 'boolean';
    if (typeof value !== 'string') return false;
    if (choices) return choices.includes(value);
    return !fallback.startsWith('#') || /^#[0-9a-f]{6}$/i.test(value);
}

export function readReactBitsSettings(
    saved: unknown,
): Record<string, EffectSettings> {
    const stored =
        saved && typeof saved === 'object'
            ? (saved as Record<string, unknown>)
            : {};
    return Object.fromEntries(
        reactBitsEffects.map(({ kind, defaults, choices }) => {
            const values =
                stored[kind] && typeof stored[kind] === 'object'
                    ? (stored[kind] as Record<string, unknown>)
                    : {};
            const valid: EffectSettings = {};
            for (const [key, fallback] of Object.entries(defaults)) {
                const value = values[key];
                valid[key] = isValidSetting(value, fallback, choices?.[key])
                    ? value
                    : fallback;
            }
            return [kind, valid];
        }),
    );
}
