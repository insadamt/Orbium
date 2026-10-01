import type { BackgroundOption } from './background-choice';
import type {
    BackgroundDraft,
    BackgroundKind,
    BackgroundPreferences,
} from './background-preferences';
import { reactBitsEffects } from './react-bits-catalog';

export const wallpaperOptions: BackgroundOption[] = [
    {
        kind: 'default',
        title: 'Orbium default',
        description: 'Quiet neutral atmosphere',
    },
    {
        kind: 'image',
        title: 'Your image',
        description: 'A photo or image from this browser',
    },
    {
        kind: 'ghost',
        title: 'Ghost Fibers',
        description: 'Luminous moving fibers',
    },
    {
        kind: 'molten',
        title: 'Molten Metal',
        description: 'Liquid light and shadow',
    },
    ...reactBitsEffects.map(({ kind, title, description }) => ({
        kind,
        title,
        description,
    })),
];

export function createWallpaperDraft(
    kind: BackgroundKind,
    preferences: BackgroundPreferences,
): BackgroundDraft {
    return {
        kind,
        ghost: { ...preferences.ghost },
        molten: { ...preferences.molten },
        effect: preferences.effects[kind]
            ? { ...preferences.effects[kind] }
            : undefined,
    };
}
