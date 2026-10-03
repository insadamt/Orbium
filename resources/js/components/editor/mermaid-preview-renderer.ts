type CachedPreview = { svg: string; renderId: string };

const previewCache = new Map<string, Promise<CachedPreview>>();
let mermaidInitialized = false;

async function renderMermaidPreview(source: string): Promise<CachedPreview> {
    const [{ default: mermaid }, { default: DOMPurify }] = await Promise.all([
        import('mermaid'),
        import('dompurify'),
    ]);
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
