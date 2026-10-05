export type CachedPreview = { svg: string; renderId: string };

export const mermaidRendererVersion = 'mermaid-12.0.0-neutral-strict-v1';

const previewCache = new Map<string, Promise<CachedPreview>>();
let mermaidInitialized = false;
let preloadScheduled = false;
let renderChain: Promise<void> = Promise.resolve();

function importMermaidDependencies() {
    return Promise.all([import('mermaid'), import('dompurify')]);
}

let dependenciesPromise:
    | ReturnType<typeof importMermaidDependencies>
    | undefined;

function loadMermaidDependencies() {
    dependenciesPromise ??= importMermaidDependencies().catch((error) => {
        dependenciesPromise = undefined;
        throw error;
    });
    return dependenciesPromise;
}

export function preloadMermaidRenderer() {
    if (preloadScheduled || dependenciesPromise) return;
    preloadScheduled = true;
    const preload = () => {
        preloadScheduled = false;
        void loadMermaidDependencies().catch(() => undefined);
    };
    if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(preload, { timeout: 1500 });
    } else {
        window.setTimeout(preload, 0);
    }
}

async function renderMermaidPreview(source: string): Promise<CachedPreview> {
    const [{ default: mermaid }, { default: DOMPurify }] =
        await loadMermaidDependencies();
    if (!mermaidInitialized) {
        mermaid.initialize({
            startOnLoad: false,
            securityLevel: 'strict',
            htmlLabels: false,
            theme: 'neutral',
        });
        mermaidInitialized = true;
    }
    const renderId = `orbium-mermaid-${crypto.randomUUID()}`;
    const render = renderChain.then(() => mermaid.render(renderId, source));
    renderChain = render.then(
        () => undefined,
        () => undefined,
    );
    const result = await render;
    return {
        renderId,
        svg: DOMPurify.sanitize(result.svg, {
            USE_PROFILES: { svg: true, svgFilters: true },
        }),
    };
}

export async function getMermaidPreviewEntry(
    source: string,
): Promise<CachedPreview> {
    let cached = previewCache.get(source);
    if (!cached) {
        cached = renderMermaidPreview(source);
        previewCache.set(source, cached);
        if (previewCache.size > 200) {
            previewCache.delete(previewCache.keys().next().value!);
        }
    }
    try {
        return await cached;
    } catch (error) {
        previewCache.delete(source);
        throw error;
    }
}

export async function getMermaidPreview(
    source: string,
    savedPreview?: CachedPreview,
): Promise<string> {
    const { svg, renderId } =
        savedPreview ?? (await getMermaidPreviewEntry(source));
    const { default: DOMPurify } = await import('dompurify');
    const safeSvg = DOMPurify.sanitize(svg, {
        USE_PROFILES: { svg: true, svgFilters: true },
    });
    return safeSvg.replaceAll(
        renderId,
        `orbium-mermaid-${crypto.randomUUID()}`,
    );
}
