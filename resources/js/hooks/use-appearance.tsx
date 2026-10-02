import { useSyncExternalStore } from 'react';
import { revealAppearanceFromCenter } from '@/backgrounds/appearance-reveal';

export type ResolvedAppearance = 'light' | 'dark';
export type Appearance = ResolvedAppearance | 'system';

export type UseAppearanceReturn = {
    readonly appearance: Appearance;
    readonly resolvedAppearance: ResolvedAppearance;
    readonly updateAppearance: (mode: Appearance) => void;
};

const listeners = new Set<() => void>();
let currentAppearance: Appearance = 'system';

const prefersDark = (): boolean => {
    if (typeof window === 'undefined') {
        return false;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const setCookie = (name: string, value: string, days = 365): void => {
    if (typeof document === 'undefined') {
        return;
    }

    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

const getStoredAppearance = (): Appearance => {
    if (typeof window === 'undefined') {
        return 'system';
    }

    return (localStorage.getItem('appearance') as Appearance) || 'system';
};

const isDarkMode = (appearance: Appearance): boolean => {
    return appearance === 'dark' || (appearance === 'system' && prefersDark());
};

const applyTheme = (appearance: Appearance): void => {
    if (typeof document === 'undefined') {
        return;
    }

    const isDark = isDarkMode(appearance);

    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
};

const subscribe = (callback: () => void) => {
    listeners.add(callback);

    return () => listeners.delete(callback);
};

const notify = (): void => listeners.forEach((listener) => listener());

const mediaQuery = (): MediaQueryList | null => {
    if (typeof window === 'undefined') {
        return null;
    }

    return window.matchMedia('(prefers-color-scheme: dark)');
};

const handleSystemThemeChange = (): void => {
    const applySystemTheme = () => {
        applyTheme(currentAppearance);
        notify();
    };
    const resolvedThemeChanged =
        currentAppearance === 'system' &&
        document.documentElement.classList.contains('dark') !== prefersDark();
    if (resolvedThemeChanged) revealAppearanceFromCenter(applySystemTheme);
    else applySystemTheme();
};

const handleStoredAppearanceChange = (event: StorageEvent): void => {
    if (event.key !== 'appearance') return;
    currentAppearance = getStoredAppearance();
    applyTheme(currentAppearance);
    notify();
};

export function initializeTheme(): void {
    if (typeof window === 'undefined') {
        return;
    }

    if (!localStorage.getItem('appearance')) {
        localStorage.setItem('appearance', 'system');
        setCookie('appearance', 'system');
    }

    currentAppearance = getStoredAppearance();
    applyTheme(currentAppearance);

    mediaQuery()?.addEventListener('change', handleSystemThemeChange);
    window.addEventListener('storage', handleStoredAppearanceChange);
}

export function useAppearance(): UseAppearanceReturn {
    const appearance: Appearance = useSyncExternalStore(
        subscribe,
        () => currentAppearance,
        () => 'system',
    );

    const resolvedAppearance = useSyncExternalStore(
        subscribe,
        () =>
            isDarkMode(currentAppearance)
                ? ('dark' as const)
                : ('light' as const),
        () => 'light' as const,
    );

    const updateAppearance = (mode: Appearance): void => {
        if (mode === currentAppearance) return;
        const changesResolvedTheme =
            isDarkMode(mode) !== isDarkMode(currentAppearance);
        const applyAppearance = () => {
            currentAppearance = mode;
            localStorage.setItem('appearance', mode);
            setCookie('appearance', mode);
            applyTheme(mode);
            notify();
        };
        if (changesResolvedTheme) revealAppearanceFromCenter(applyAppearance);
        else applyAppearance();
    };

    return { appearance, resolvedAppearance, updateAppearance } as const;
}
