import {
    iconChoiceKey,
    isBuiltinIcon,
    isCatalogEmoji,
    type InlineIconChoice,
} from './icon-catalog';

export const iconInsertedEvent = 'orbium:inline-icon-inserted';

export function announceInsertedIcon(
    host: HTMLElement,
    choice: InlineIconChoice,
) {
    host.dispatchEvent(new CustomEvent(iconInsertedEvent, { detail: choice }));
}

export type IconPreferences = {
    recent: InlineIconChoice[];
    favorites: InlineIconChoice[];
};

function validChoice(value: unknown): value is InlineIconChoice {
    if (!value || typeof value !== 'object') return false;
    const choice = value as Record<string, unknown>;
    if (
        typeof choice.label !== 'string' ||
        !choice.label.trim() ||
        choice.label.length > 160
    )
        return false;
    if (choice.kind === 'emoji') return isCatalogEmoji(choice.value);
    if (choice.kind === 'builtin') return isBuiltinIcon(choice.name);
    return (
        choice.kind === 'custom' &&
        Number.isSafeInteger(choice.attachmentId) &&
        Number(choice.attachmentId) > 0
    );
}

export function readIconPreferences(key: string): IconPreferences {
    try {
        const saved = JSON.parse(localStorage.getItem(key) ?? '{}');
        return {
            recent: Array.isArray(saved.recent)
                ? saved.recent.filter(validChoice).slice(0, 24)
                : [],
            favorites: Array.isArray(saved.favorites)
                ? saved.favorites.filter(validChoice).slice(0, 100)
                : [],
        };
    } catch {
        return { recent: [], favorites: [] };
    }
}

export function saveIconPreferences(key: string, preferences: IconPreferences) {
    try {
        localStorage.setItem(key, JSON.stringify(preferences));
    } catch {
        //
        // Browser storage is optional; blocked storage must not prevent inserting content.
        //
    }
}

export function rememberIconChoice(
    preferences: IconPreferences,
    choice: InlineIconChoice,
): IconPreferences {
    return {
        ...preferences,
        recent: [
            choice,
            ...preferences.recent.filter(
                (item) => iconChoiceKey(item) !== iconChoiceKey(choice),
            ),
        ].slice(0, 24),
    };
}
