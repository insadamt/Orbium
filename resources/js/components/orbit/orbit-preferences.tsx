import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { OrbitQuality } from './orbit-types';

export const useOrbitPreferences = create(
    persist<{
        quality: OrbitQuality;
        reduceMotion: boolean;
        setQuality: (quality: OrbitQuality) => void;
        setReduceMotion: (reduceMotion: boolean) => void;
    }>(
        (set) => ({
            quality: 'balanced',
            reduceMotion: false,
            setQuality: (quality) => set({ quality }),
            setReduceMotion: (reduceMotion) => set({ reduceMotion }),
        }),
        { name: 'orbium.orbit.preferences.v1' },
    ),
);

export const useOrbitInteraction = create<{ paused: boolean }>(() => ({
    paused: false,
}));

export function useReducedOrbitMotion() {
    const preference = useOrbitPreferences((state) => state.reduceMotion);
    const [system, setSystem] = useState(() =>
        typeof window === 'undefined'
            ? false
            : window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
    useEffect(() => {
        const query = window.matchMedia('(prefers-reduced-motion: reduce)');
        const update = () => setSystem(query.matches);
        query.addEventListener('change', update);
        return () => query.removeEventListener('change', update);
    }, []);
    return preference || system;
}

export function OrbitPreferences() {
    const { reduceMotion, setReduceMotion } = useOrbitPreferences();
    return (
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <label className="flex items-center gap-2">
                <input
                    type="checkbox"
                    checked={reduceMotion}
                    onChange={(event) => setReduceMotion(event.target.checked)}
                />
                Reduce motion
            </label>
        </div>
    );
}
