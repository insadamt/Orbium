import { maximumZoom, minimumZoom, type OrbingCamera } from './orbing-layout';

export type OrbingSnapshot = {
    camera: OrbingCamera;
    selectedId: number | null;
};

export function readOrbingSnapshot(key: string): OrbingSnapshot | null {
    try {
        const saved = JSON.parse(localStorage.getItem(key) ?? 'null');
        if (
            saved?.version !== 1 ||
            !Number.isFinite(saved.camera?.x) ||
            !Number.isFinite(saved.camera?.y) ||
            Math.abs(saved.camera.x) > 10_000_000 ||
            Math.abs(saved.camera.y) > 10_000_000 ||
            !Number.isFinite(saved.camera?.zoom) ||
            saved.camera.zoom < minimumZoom ||
            saved.camera.zoom > maximumZoom ||
            (saved.selectedId !== null &&
                (!Number.isSafeInteger(saved.selectedId) ||
                    saved.selectedId <= 0))
        )
            return null;
        return { camera: saved.camera, selectedId: saved.selectedId };
    } catch {
        return null;
    }
}

export function persistOrbingSnapshot(key: string, snapshot: OrbingSnapshot) {
    try {
        localStorage.setItem(key, JSON.stringify({ version: 1, ...snapshot }));
    } catch {
        // Camera persistence is optional when browser storage is unavailable.
    }
}

export function readOrbitalSeconds(key: string) {
    try {
        const value = Number(localStorage.getItem(`${key}.clock`) ?? 0);
        return Number.isFinite(value) && value >= 0 && value < 10_000_000
            ? value
            : 0;
    } catch {
        return 0;
    }
}

export function persistOrbitalSeconds(key: string, seconds: number) {
    try {
        localStorage.setItem(`${key}.clock`, String(seconds));
    } catch {
        // Optional browser storage must not interrupt the scene.
    }
}
