import { libraryFilterParams, type LibraryFilters } from './library-api';

export type LibraryBrowseState = {
    filters: LibraryFilters;
    pages: number;
    scroll: number;
};
export function libraryStateKey(workspaceId: number, userId: number) {
    return `orbium.library.${userId}.${workspaceId}`;
}
export function readLibraryState(key: string): LibraryBrowseState | null {
    try {
        const raw = JSON.parse(
            sessionStorage.getItem(key) ?? 'null',
        ) as LibraryBrowseState | null;
        if (
            !raw ||
            typeof raw.filters?.q !== 'string' ||
            !['all', 'images', 'files'].includes(raw.filters.type) ||
            !['newest', 'name', 'size'].includes(raw.filters.sort)
        )
            return null;
        return {
            filters: { ...raw.filters, q: raw.filters.q.slice(0, 255) },
            pages: Math.max(
                1,
                Math.min(20, Math.floor(Number(raw.pages)) || 1),
            ),
            scroll: Math.max(0, Number(raw.scroll) || 0),
        };
    } catch {
        return null;
    }
}
export function saveLibraryState(key: string, state: LibraryBrowseState) {
    try {
        sessionStorage.setItem(key, JSON.stringify(state));
    } catch {
        /* Storage is optional for browsing. */
    }
}
export function initialLibraryState(
    key: string,
    imagesOnly: boolean,
    picker: boolean,
): LibraryBrowseState {
    const defaults: LibraryFilters = {
        q: '',
        type: imagesOnly ? 'images' : 'all',
        sort: 'newest',
    };
    if (picker) return { filters: defaults, pages: 1, scroll: 0 };
    const saved = readLibraryState(key);
    const params = new URLSearchParams(window.location.search);
    if (!params.has('q') && !params.has('type') && !params.has('sort'))
        return saved ?? { filters: defaults, pages: 1, scroll: 0 };
    const type = params.get('type');
    const sort = params.get('sort');
    const filters: LibraryFilters = {
        q: (params.get('q') ?? '').slice(0, 255),
        type: type === 'files' || type === 'images' ? type : 'all',
        sort: sort === 'name' || sort === 'size' ? sort : 'newest',
    };
    return saved &&
        libraryFilterParams(saved.filters).toString() ===
            libraryFilterParams(filters).toString()
        ? { ...saved, filters }
        : { filters, pages: 1, scroll: 0 };
}

export function restoreLibraryScroll(top: number) {
    let timer: ReturnType<typeof setTimeout>;
    let frame = 0;
    const events = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const;
    const stop = () => {
        clearTimeout(timer);
        cancelAnimationFrame(frame);
        observer.disconnect();
        events.forEach((event) => window.removeEventListener(event, stop));
    };
    const schedule = () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            frame = requestAnimationFrame(() => {
                window.scrollTo({ top, behavior: 'instant' });
                stop();
            });
        }, 100);
    };
    const observer = new ResizeObserver(schedule);
    const gallery = document.querySelector('.library-browser');
    if (gallery) observer.observe(gallery);
    events.forEach((event) =>
        window.addEventListener(event, stop, { once: true, passive: true }),
    );
    schedule();
    return stop;
}
