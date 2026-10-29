// Browser-local navigation layout preferences; content and tab state stay shared.
import { useSyncExternalStore } from 'react';

export type NavigationMode = 'classic' | 'workspace';
export type WorkspaceNavigationPreferences = {
    mode: NavigationMode;
    sidebarOpen: boolean;
    sidebarWidth: number;
    tabsPinned: boolean;
};

const key = 'orbium.workspace-navigation.v1';
const defaults: WorkspaceNavigationPreferences = {
    mode: 'classic',
    sidebarOpen: true,
    sidebarWidth: 280,
    tabsPinned: false,
};
const listeners = new Set<() => void>();

function readPreferences(): WorkspaceNavigationPreferences {
    if (typeof window === 'undefined') return defaults;
    try {
        const data = JSON.parse(localStorage.getItem(key) ?? 'null');
        if (!data || typeof data !== 'object') return defaults;
        return {
            mode: data.mode === 'workspace' ? 'workspace' : 'classic',
            sidebarOpen: data.sidebarOpen !== false,
            sidebarWidth:
                typeof data.sidebarWidth === 'number' &&
                Number.isFinite(data.sidebarWidth)
                    ? Math.min(440, Math.max(220, data.sidebarWidth))
                    : defaults.sidebarWidth,
            tabsPinned: data.tabsPinned === true,
        };
    } catch {
        return defaults;
    }
}

let preferences = readPreferences();

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function useWorkspaceNavigationPreferences() {
    return useSyncExternalStore(subscribe, () => preferences, () => defaults);
}

export function updateWorkspaceNavigationPreferences(
    values: Partial<WorkspaceNavigationPreferences>,
) {
    preferences = { ...preferences, ...values };
    try {
        localStorage.setItem(key, JSON.stringify(preferences));
    } catch {
        // Keep the current session interactive when storage is blocked.
    }
    listeners.forEach((listener) => listener());
}
