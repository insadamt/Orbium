import { useEffect, useState } from 'react';

const databaseName = 'orbium-backgrounds';
const imageKey = 'selected-image';
const imageChangedEvent = 'orbium:background-image-changed';

function openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(databaseName, 1);
        request.onupgradeneeded = () =>
            request.result.createObjectStore('images');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function useImageStore<T>(
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction('images', mode);
        const request = operation(transaction.objectStore('images'));
        transaction.oncomplete = () => {
            database.close();
            resolve(request.result);
        };
        transaction.onerror = () => {
            database.close();
            reject(transaction.error);
        };
    });
}

async function decodeImage(url: string): Promise<void> {
    const image = new Image();
    image.src = url;
    await image.decode();
}

export async function readBackgroundImage(): Promise<Blob | undefined> {
    return useImageStore('readonly', (store) => store.get(imageKey));
}

export function validateBackgroundImage(file: File): void {
    if (
        !['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(
            file.type,
        )
    ) {
        throw new Error('Choose a PNG, JPEG, WebP, or GIF image.');
    }
    if (file.size > 10 * 1024 * 1024) {
        throw new Error('Choose an image smaller than 10 MB.');
    }
}

export async function saveBackgroundImage(file: File): Promise<void> {
    validateBackgroundImage(file);
    await useImageStore('readwrite', (store) => store.put(file, imageKey));
    window.dispatchEvent(new Event(imageChangedEvent));
}

export async function removeBackgroundImage(): Promise<void> {
    await useImageStore('readwrite', (store) => store.delete(imageKey));
    window.dispatchEvent(new Event(imageChangedEvent));
}

export function useBackgroundImage() {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
        let currentUrl: string | null = null;
        let active = true;
        let requestVersion = 0;
        async function refreshImage() {
            const version = ++requestVersion;
            setLoadError(false);
            try {
                const image = await readBackgroundImage();
                if (!active || version !== requestVersion) return;
                const nextUrl = image ? URL.createObjectURL(image) : null;
                if (nextUrl) {
                    try {
                        await decodeImage(nextUrl);
                    } catch {
                        URL.revokeObjectURL(nextUrl);
                        throw new Error(
                            'Could not load the saved background image.',
                        );
                    }
                }
                if (!active || version !== requestVersion) {
                    if (nextUrl) URL.revokeObjectURL(nextUrl);
                    return;
                }
                setImageUrl(nextUrl);
                if (currentUrl) URL.revokeObjectURL(currentUrl);
                currentUrl = nextUrl;
            } catch {
                if (active && version === requestVersion) {
                    setImageUrl(null);
                    setLoadError(true);
                }
            } finally {
                if (active && version === requestVersion) setLoading(false);
            }
        }
        void refreshImage();
        window.addEventListener(imageChangedEvent, refreshImage);
        return () => {
            active = false;
            requestVersion++;
            window.removeEventListener(imageChangedEvent, refreshImage);
            if (currentUrl) URL.revokeObjectURL(currentUrl);
        };
    }, []);

    return { imageUrl, loading, loadError };
}
