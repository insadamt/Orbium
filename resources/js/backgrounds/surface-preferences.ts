import { useSyncExternalStore } from 'react';

export type SurfaceStyle = 'normal' | 'frosted';

const storageKey = 'orbium.surface-style.v1';
const listeners = new Set<() => void>();

function readSurfaceStyle(): SurfaceStyle {
    if (typeof window === 'undefined') return 'normal';
    try {
        return localStorage.getItem(storageKey) === 'frosted'
            ? 'frosted'
            : 'normal';
    } catch {
        return 'normal';
    }
}

let surfaceStyle = readSurfaceStyle();

export function initializeSurfaceStyle(): void {
    document.documentElement.dataset.surfaceStyle = surfaceStyle;
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function useSurfaceStyle() {
    return useSyncExternalStore(
        subscribe,
        () => surfaceStyle,
        () => 'normal',
    );
}

export function selectSurfaceStyle(nextStyle: SurfaceStyle): void {
    if (nextStyle === surfaceStyle) return;
    surfaceStyle = nextStyle;
    document.documentElement.dataset.surfaceStyle = nextStyle;
    try {
        localStorage.setItem(storageKey, nextStyle);
    } catch {
        // Keep the selection available for this page when browser storage is blocked.
    }
    listeners.forEach((listener) => listener());
}
