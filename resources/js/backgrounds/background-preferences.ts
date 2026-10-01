import { useSyncExternalStore } from 'react';

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

export type BackgroundKind = 'default' | 'ghost' | 'molten' | 'image';
export type GhostSettings = typeof ghostDefaults;
export type MoltenSettings = typeof moltenDefaults;
export type BackgroundPreferences = {
    kind: BackgroundKind;
    ghost: GhostSettings;
    molten: MoltenSettings;
};

const storageKey = 'orbium.backgrounds.v1';
const listeners = new Set<() => void>();
const defaultPreferences: BackgroundPreferences = {
    kind: 'default',
    ghost: ghostDefaults,
    molten: moltenDefaults,
};

function readPreferences(): BackgroundPreferences {
    if (typeof window === 'undefined') return defaultPreferences;
    try {
        const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
        if (!saved || typeof saved !== 'object') return defaultPreferences;
        const kind = ['default', 'ghost', 'molten', 'image'].includes(
            saved.kind,
        )
            ? (saved.kind as BackgroundKind)
            : 'default';
        return {
            kind,
            ghost: { ...ghostDefaults, ...saved.ghost },
            molten: { ...moltenDefaults, ...saved.molten },
        };
    } catch {
        return defaultPreferences;
    }
}

let preferences = readPreferences();

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function savePreferences(next: BackgroundPreferences): void {
    localStorage.setItem(storageKey, JSON.stringify(next));
    preferences = next;
    listeners.forEach((listener) => listener());
}

export function useBackgroundPreferences() {
    const current = useSyncExternalStore(
        subscribe,
        () => preferences,
        () => defaultPreferences,
    );
    return {
        preferences: current,
        selectBackground: (kind: BackgroundKind) =>
            savePreferences({ ...preferences, kind }),
        updateGhost: (values: Partial<GhostSettings>) =>
            savePreferences({
                ...preferences,
                ghost: { ...preferences.ghost, ...values },
            }),
        updateMolten: (values: Partial<MoltenSettings>) =>
            savePreferences({
                ...preferences,
                molten: { ...preferences.molten, ...values },
            }),
        resetGhost: () =>
            savePreferences({ ...preferences, ghost: ghostDefaults }),
        resetMolten: () =>
            savePreferences({ ...preferences, molten: moltenDefaults }),
    };
}
