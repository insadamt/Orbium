import { useEffect, useState, type ComponentType } from 'react';
import { hyperspeedPresets } from '@/components/HyperSpeedPresets';
import type { EffectSettings } from './react-bits-catalog';

type EffectModule = { default: ComponentType<Record<string, unknown>> };
const componentModules = import.meta.glob<EffectModule>('../components/*.jsx');
const loadedModules = new Map<string, EffectModule>();
const loadingModules = new Map<string, Promise<EffectModule>>();

const componentNames: Record<string, string> = {
    gradientWaves: 'GradientWaves',
    webThreads: 'WebThreads',
    lightTunnel: 'LightTunnel',
    scanner: 'Scanner',
    lightfall: 'Lightfall',
    liquidEther: 'LiquidEther',
    prism: 'Prism',
    darkVeil: 'DarkVeil',
    lightPillar: 'LightPillar',
    silk: 'Silk',
    softAurora: 'SoftAurora',
    aurora: 'Aurora',
    plasma: 'Plasma',
    grainient: 'Grainient',
    prismaticBurst: 'PrismaticBurst',
    hyperspeed: 'Hyperspeed',
    iridescence: 'Iridescence',
};

function moduleLoader(kind: string): (() => Promise<EffectModule>) | undefined {
    const componentName = componentNames[kind];
    return componentName
        ? componentModules[`../components/${componentName}.jsx`]
        : undefined;
}

function loadReactBitsEffect(kind: string): Promise<EffectModule> {
    const loaded = loadedModules.get(kind);
    if (loaded) return Promise.resolve(loaded);
    const pending = loadingModules.get(kind);
    if (pending) return pending;
    const load = moduleLoader(kind);
    if (!load) return Promise.reject(new Error(`Unknown background: ${kind}`));
    const request = load()
        .then((module) => {
            loadedModules.set(kind, module);
            loadingModules.delete(kind);
            return module;
        })
        .catch((error: unknown) => {
            loadingModules.delete(kind);
            throw error;
        });
    loadingModules.set(kind, request);
    return request;
}

export async function preloadReactBitsEffect(kind: string): Promise<void> {
    await loadReactBitsEffect(kind);
}

function hexToNumber(hex: string): number {
    return Number.parseInt(hex.slice(1), 16);
}

function hexToUnitRgb(hex: string): number[] {
    return [1, 3, 5].map(
        (index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255,
    );
}

function effectProps(
    kind: string,
    settings: EffectSettings,
    reducedMotion: boolean,
): Record<string, unknown> {
    if (kind === 'hyperspeed') {
        const preset =
            hyperspeedPresets[String(settings.preset)] ?? hyperspeedPresets.one;
        const colors = preset.colors as Record<string, unknown>;
        return {
            effectOptions: {
                ...preset,
                speedUp: settings.speedUp,
                roadWidth: settings.roadWidth,
                lanesPerRoad: settings.lanesPerRoad,
                fov: settings.fov,
                lightPairsPerRoadWay: settings.lightPairsPerRoadWay,
                totalSideLightSticks: settings.totalSideLightSticks,
                colors: {
                    ...colors,
                    background: hexToNumber(String(settings.backgroundColor)),
                    leftCars: [hexToNumber(String(settings.leftCarsColor))],
                    rightCars: [hexToNumber(String(settings.rightCarsColor))],
                },
            },
            lightMode: false,
        };
    }
    if (kind === 'iridescence') {
        return { ...settings, color: hexToUnitRgb(String(settings.color)) };
    }
    if (kind === 'prism' || kind === 'prismaticBurst') {
        const { offsetX, offsetY, ...rest } = settings;
        return {
            ...rest,
            offset: { x: Number(offsetX), y: Number(offsetY) },
            ...(kind === 'prismaticBurst'
                ? { paused: reducedMotion, mixBlendMode: 'normal' }
                : {}),
            lightMode: false,
        };
    }
    return {
        ...settings,
        paused: reducedMotion,
        lightMode: false,
        ...(kind === 'lightPillar' || kind === 'lightfall'
            ? { mixBlendMode: 'normal' }
            : {}),
    };
}

export function ReactBitsBackground({
    kind,
    settings,
    reducedMotion,
}: {
    kind: string;
    settings: EffectSettings;
    reducedMotion: boolean;
}) {
    const [loadedModule, setLoadedModule] = useState<EffectModule | null>(
        () => loadedModules.get(kind) ?? null,
    );
    const [loadError, setLoadError] = useState<Error | null>(null);

    useEffect(() => {
        let active = true;
        void loadReactBitsEffect(kind).then(
            (module) => {
                if (active) setLoadedModule(module);
            },
            (error: unknown) => {
                if (active)
                    setLoadError(
                        error instanceof Error
                            ? error
                            : new Error(`Could not load background: ${kind}`),
                    );
            },
        );
        return () => {
            active = false;
        };
    }, [kind]);

    if (loadError) throw loadError;
    if (!loadedModule) return null;
    const props = effectProps(kind, settings, reducedMotion);
    const LoadedEffect = loadedModule.default;
    return (
        <div className="orbium-background-effect">
            <LoadedEffect {...props} />
        </div>
    );
}
