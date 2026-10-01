import { useSyncExternalStore } from 'react';
import {
    defaultReactBitsSettings,
    findReactBitsEffect,
    readReactBitsSettings,
    type EffectSettings,
} from './react-bits-catalog';

export const ghostDefaults = {
    lineColor: '#74748d',
    glowColor: '#9b9baa',
    speed: 0.2,
    scale: 2,
    rotation: 0,
    rotationSpeed: 0.25,
    layers: 4,
    waveAmplitude: 0.015,
    waveFrequency: 3,
    waveSpeed: 0.15,
    layerSpeed: 0.08,
    twist: 0.1,
    twistFrequency: 5,
    twistSpeed: 1.2,
    lineFrequency: 5,
    lineSpacing: 2,
    lineSharpness: 16,
    glowFalloff: 10,
    glowIntensity: 1.6,
    brightness: 2,
    blueBoost: 1,
    vignette: 0.8,
    grain: 0.05,
    dpr: 1,
    fps: 60,
};

export const moltenDefaults = {
    color1: '#404047',
    color2: '#9999a3',
    color3: '#ffffff',
    backgroundColor: '#0d1012',
    colorMode: 'molten',
    speed: 0.35,
    scale: 4,
    detail: 3,
    glow: 1.6,
    coreSize: 0.1,
    swirl: 1,
    fold: -0.2,
    blackPoint: 0.05,
    brightness: 1.3,
    grain: true,
    grainIntensity: 0.05,
    mouseInteraction: false,
    mouseStrength: 0.3,
    opacity: 1,
};

export type BackgroundKind =
    | 'default'
    | 'ghost'
    | 'molten'
    | 'image'
    | (string & {});
export type GhostSettings = typeof ghostDefaults;
export type MoltenSettings = typeof moltenDefaults;
export type BackgroundPreferences = {
    kind: BackgroundKind;
    pauseAnimations: boolean;
    ghost: GhostSettings;
    molten: MoltenSettings;
    effects: Record<string, EffectSettings>;
};
export type BackgroundDraft = {
    kind: BackgroundKind;
    ghost: GhostSettings;
    molten: MoltenSettings;
    effect?: EffectSettings;
};

const storageKey = 'orbium.backgrounds.v1';
const listeners = new Set<() => void>();
const defaultPreferences: BackgroundPreferences = {
    kind: 'default',
    pauseAnimations: false,
    ghost: ghostDefaults,
    molten: moltenDefaults,
    effects: defaultReactBitsSettings(),
};

function readPreferences(): BackgroundPreferences {
    if (typeof window === 'undefined') return defaultPreferences;
    try {
        const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
        if (!saved || typeof saved !== 'object') return defaultPreferences;
        const kind =
            ['default', 'ghost', 'molten', 'image'].includes(saved.kind) ||
            findReactBitsEffect(saved.kind)
                ? (saved.kind as BackgroundKind)
                : 'default';
        return {
            kind,
            pauseAnimations: saved.pauseAnimations === true,
            ghost: { ...ghostDefaults, ...saved.ghost },
            molten: { ...moltenDefaults, ...saved.molten },
            effects: readReactBitsSettings(saved.effects),
        };
    } catch {
        return defaultPreferences;
    }
}

let preferences = readPreferences();
let persistenceTimer: ReturnType<typeof setTimeout> | null = null;

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function persistPreferences(): void {
    if (persistenceTimer) clearTimeout(persistenceTimer);
    persistenceTimer = null;
    localStorage.setItem(storageKey, JSON.stringify(preferences));
}

function savePreferences(
    next: BackgroundPreferences,
    delayPersistence = false,
): void {
    preferences = next;
    listeners.forEach((listener) => listener());
    if (delayPersistence) {
        if (persistenceTimer) clearTimeout(persistenceTimer);
        persistenceTimer = setTimeout(persistPreferences, 250);
    } else {
        persistPreferences();
    }
}

if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', () => {
        if (persistenceTimer) persistPreferences();
    });
}

export function useBackgroundPreferences() {
    const current = useSyncExternalStore(
        subscribe,
        () => preferences,
        () => defaultPreferences,
    );
    return {
        preferences: current,
        pauseAnimations: current.pauseAnimations,
        setPauseAnimations: (pauseAnimations: boolean) =>
            savePreferences({ ...preferences, pauseAnimations }),
        applyBackgroundDraft: (draft: BackgroundDraft) =>
            savePreferences({
                ...preferences,
                kind: draft.kind,
                ghost: draft.ghost,
                molten: draft.molten,
                effects: draft.effect
                    ? {
                          ...preferences.effects,
                          [draft.kind]: draft.effect,
                      }
                    : preferences.effects,
            }),
        selectBackground: (kind: BackgroundKind) =>
            savePreferences({ ...preferences, kind }),
        updateGhost: (values: Partial<GhostSettings>) =>
            savePreferences(
                {
                    ...preferences,
                    ghost: { ...preferences.ghost, ...values },
                },
                true,
            ),
        updateMolten: (values: Partial<MoltenSettings>) =>
            savePreferences(
                {
                    ...preferences,
                    molten: { ...preferences.molten, ...values },
                },
                true,
            ),
        resetGhost: () =>
            savePreferences({ ...preferences, ghost: ghostDefaults }),
        resetMolten: () =>
            savePreferences({ ...preferences, molten: moltenDefaults }),
        updateEffect: (kind: string, values: EffectSettings) =>
            savePreferences(
                {
                    ...preferences,
                    effects: {
                        ...preferences.effects,
                        [kind]: { ...preferences.effects[kind], ...values },
                    },
                },
                true,
            ),
        resetEffect: (kind: string) => {
            const effect = findReactBitsEffect(kind);
            if (!effect) return;
            savePreferences({
                ...preferences,
                effects: {
                    ...preferences.effects,
                    [kind]: { ...effect.defaults },
                },
            });
        },
    };
}
