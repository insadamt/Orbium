type CachedPreview = { svg: string; renderId: string };

const previewCache = new Map<string, Promise<CachedPreview>>();
let mermaidInitialized = false;
let preloadScheduled = false;

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
    const result = await mermaid.render(renderId, source);
    return {
        renderId,
        svg: DOMPurify.sanitize(result.svg, {
            USE_PROFILES: { svg: true, svgFilters: true },
        }),
    };
}

export async function getMermaidPreview(source: string): Promise<string> {
    let cached = previewCache.get(source);
    if (!cached) {
        cached = renderMermaidPreview(source);
        previewCache.set(source, cached);
        if (previewCache.size > 50) {
            previewCache.delete(previewCache.keys().next().value!);
        }
    }
    try {
        const { svg, renderId } = await cached;
        return svg.replaceAll(
            renderId,
            `orbium-mermaid-${crypto.randomUUID()}`,
        );
    } catch (error) {
        previewCache.delete(source);
        throw error;
    }
}
